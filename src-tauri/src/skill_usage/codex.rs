use serde_json::Value;
use std::{
    collections::HashMap,
    fs::{self, File},
    io::{BufRead, BufReader},
    path::{Path, PathBuf},
};

fn home_dir() -> PathBuf {
    dirs::home_dir().unwrap_or_else(|| PathBuf::from("."))
}

fn codex_home_dir() -> PathBuf {
    std::env::var_os("CODEX_HOME")
        .map(PathBuf::from)
        .filter(|path| path.exists())
        .unwrap_or_else(|| home_dir().join(".codex"))
}

fn collect_jsonl_files(dir: &Path, out: &mut Vec<PathBuf>) {
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            collect_jsonl_files(&path, out);
        } else if path.extension().is_some_and(|e| e == "jsonl") {
            out.push(path);
        }
    }
}

fn slashify_path(p: &str) -> String {
    p.replace('\\', "/")
}

fn normalize_skill_md_path(path: &str) -> String {
    let normalized = slashify_path(path.trim());
    let path = PathBuf::from(&normalized);
    if let Ok(canonical) = path.canonicalize() {
        slashify_path(&canonical.to_string_lossy())
    } else {
        normalized
    }
}

fn command_name(cmd: &str) -> Option<&str> {
    cmd.split_whitespace()
        .find(|part| !part.contains('=') && !part.starts_with('-'))
        .map(|part| part.trim_matches(|c| matches!(c, '\'' | '"' | '(' | ')')))
}

fn is_direct_skill_file_reader(cmd: &str) -> bool {
    matches!(
        command_name(cmd),
        Some("cat" | "sed" | "head" | "tail" | "nl" | "bat" | "less" | "more")
    )
}

fn command_hits_allowed_skill(cmd: &str, allowed_longest_first: &[String]) -> Vec<String> {
    if !is_direct_skill_file_reader(cmd) {
        return Vec::new();
    }

    let normalized_cmd = slashify_path(cmd);
    allowed_longest_first
        .iter()
        .filter(|path| normalized_cmd.contains(path.as_str()))
        .cloned()
        .collect()
}

fn exec_command_from_call(value: &Value) -> Option<String> {
    if value
        .get("payload")
        .and_then(|payload| payload.get("type"))
        .and_then(Value::as_str)
        != Some("function_call")
    {
        return None;
    }

    let payload = value.get("payload")?;
    let name = payload.get("name").and_then(Value::as_str)?;
    if name != "exec_command" && name != "functions.exec_command" {
        return None;
    }

    let arguments = payload.get("arguments")?.as_str()?;
    let parsed = serde_json::from_str::<Value>(arguments).ok()?;
    parsed
        .get("cmd")
        .and_then(Value::as_str)
        .map(ToOwned::to_owned)
}

fn message_input_texts(value: &Value) -> Vec<&str> {
    if value
        .get("payload")
        .and_then(|payload| payload.get("type"))
        .and_then(Value::as_str)
        != Some("message")
    {
        return Vec::new();
    }

    let Some(payload) = value.get("payload") else {
        return Vec::new();
    };
    if payload.get("role").and_then(Value::as_str) != Some("user") {
        return Vec::new();
    }

    payload
        .get("content")
        .and_then(Value::as_array)
        .map(|items| {
            items
                .iter()
                .filter_map(|item| item.get("text").and_then(Value::as_str))
                .collect()
        })
        .unwrap_or_default()
}

fn extract_skill_context_paths(text: &str) -> Vec<&str> {
    let mut paths = Vec::new();
    let mut rest = text;

    while let Some(start) = rest.find("<skill>") {
        let skill_rest = &rest[start + "<skill>".len()..];
        let Some(end) = skill_rest.find("</skill>") else {
            break;
        };
        let skill_block = &skill_rest[..end];
        if let Some(path_start) = skill_block.find("<path>") {
            let path_rest = &skill_block[path_start + "<path>".len()..];
            if let Some(path_end) = path_rest.find("</path>") {
                paths.push(path_rest[..path_end].trim());
            }
        }
        rest = &skill_rest[end + "</skill>".len()..];
    }

    paths
}

fn count_injected_skill_contexts(
    value: &Value,
    allowed_longest_first: &[String],
    counts: &mut HashMap<String, u64>,
) {
    let mut counted = std::collections::HashSet::new();

    for text in message_input_texts(value) {
        for path in extract_skill_context_paths(text) {
            let normalized = normalize_skill_md_path(path);
            if !counted.insert(normalized.clone()) {
                continue;
            }
            if let Some(hit) = allowed_longest_first
                .iter()
                .find(|allowed| **allowed == normalized)
            {
                *counts.entry(hit.clone()).or_default() += 1;
            }
        }
    }
}

fn scan_one_codex_jsonl(
    path: &Path,
    allowed_longest_first: &[String],
    counts: &mut HashMap<String, u64>,
) -> Result<(), std::io::Error> {
    let file = File::open(path)?;
    let reader = BufReader::new(file);

    for line in reader.lines() {
        let line = line?;
        if let Ok(value) = serde_json::from_str::<Value>(&line) {
            count_injected_skill_contexts(&value, allowed_longest_first, counts);
            if let Some(cmd) = exec_command_from_call(&value) {
                for hit in command_hits_allowed_skill(&cmd, allowed_longest_first) {
                    *counts.entry(hit).or_default() += 1;
                }
            }
        }
    }

    Ok(())
}

pub fn scan_codex_session_jsonl(
    allowed_longest_first: &[String],
) -> (HashMap<String, u64>, Vec<String>) {
    let mut notes = Vec::new();
    if allowed_longest_first.is_empty() {
        return (HashMap::new(), notes);
    }

    let codex_home = codex_home_dir();
    let session_dirs = [
        codex_home.join("sessions"),
        codex_home.join("archived_sessions"),
    ];
    let mut files = Vec::new();
    for dir in &session_dirs {
        collect_jsonl_files(dir, &mut files);
    }

    if files.is_empty() {
        notes.push("Codex: no session .jsonl transcripts".to_string());
        return (HashMap::new(), notes);
    }

    let mut counts = HashMap::new();
    let mut failures = 0usize;
    for path in &files {
        if let Err(e) = scan_one_codex_jsonl(path, allowed_longest_first, &mut counts) {
            failures += 1;
            notes.push(format!("{} ({e})", path.display()));
        }
    }

    if failures == 0 {
        notes.push(format!(
            "Codex: scanned {} session file(s), counted injected skill contexts and direct SKILL.md reads only",
            files.len()
        ));
    }

    (counts, notes)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn direct_reader_command_counts_exact_skill_md_path() {
        let allowed = vec!["/tmp/skills/dws/SKILL.md".to_string()];
        let hits = command_hits_allowed_skill("sed -n '1,80p' /tmp/skills/dws/SKILL.md", &allowed);
        assert_eq!(hits, allowed);
    }

    #[test]
    fn search_commands_do_not_count_as_skill_loads() {
        let allowed = vec!["/tmp/skills/dws/SKILL.md".to_string()];
        let hits = command_hits_allowed_skill("rg -n SKILL.md /tmp/skills/dws/SKILL.md", &allowed);
        assert!(hits.is_empty());
    }

    #[test]
    fn injected_skill_context_counts_manual_skill_attachment() {
        let allowed = vec!["/tmp/skills/publish-html-artifact/SKILL.md".to_string()];
        let value = serde_json::json!({
            "type": "response_item",
            "payload": {
                "type": "message",
                "role": "user",
                "content": [{
                    "type": "input_text",
                    "text": "<skill>\n<name>publish-html-artifact</name>\n<path>/tmp/skills/publish-html-artifact/SKILL.md</path>\n---\nname: publish-html-artifact\n---\n</skill>"
                }]
            }
        });
        let mut counts = HashMap::new();

        count_injected_skill_contexts(&value, &allowed, &mut counts);

        assert_eq!(counts.get(&allowed[0]), Some(&1));
    }
}
