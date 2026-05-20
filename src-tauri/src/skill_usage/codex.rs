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
            "Codex: scanned {} session file(s), counted direct SKILL.md reads only",
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
}
