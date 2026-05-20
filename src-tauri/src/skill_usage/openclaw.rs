use serde_json::Value;
use std::{
    collections::{HashMap, HashSet},
    fs::{self, File},
    io::{BufRead, BufReader},
    path::{Component, Path, PathBuf},
};

fn home_dir() -> PathBuf {
    dirs::home_dir().unwrap_or_else(|| PathBuf::from("."))
}

fn slashify_path(p: &str) -> String {
    p.replace('\\', "/")
}

fn expand_home_path(path: &str) -> PathBuf {
    if path == "~" {
        return home_dir();
    }

    if let Some(rest) = path.strip_prefix("~/") {
        return home_dir().join(rest);
    }

    PathBuf::from(path)
}

fn normalize_skill_md_path(path: &str) -> String {
    let expanded = expand_home_path(path);
    if let Ok(canonical) = expanded.canonicalize() {
        slashify_path(&canonical.to_string_lossy())
    } else {
        slashify_path(&expanded.to_string_lossy())
    }
}

fn unique_existing_roots() -> Vec<PathBuf> {
    let mut seen = HashSet::new();
    let mut roots = Vec::new();

    let candidates = [
        std::env::var_os("OPENCLAW_HOME").map(PathBuf::from),
        Some(home_dir().join(".openclaw")),
        std::env::var_os("QCLAW_HOME").map(PathBuf::from),
        Some(home_dir().join(".qclaw")),
    ];

    for candidate in candidates.into_iter().flatten() {
        if !candidate.exists() {
            continue;
        }

        let canonical = candidate.canonicalize().unwrap_or(candidate);
        let key = slashify_path(&canonical.to_string_lossy());
        if seen.insert(key) {
            roots.push(canonical);
        }
    }

    roots
}

fn is_session_transcript(path: &Path) -> bool {
    let has_session_dir = path
        .components()
        .any(|component| matches!(component, Component::Normal(name) if name == "sessions"));
    let file_has_jsonl = path
        .file_name()
        .and_then(|name| name.to_str())
        .is_some_and(|name| name.contains(".jsonl"));

    has_session_dir && file_has_jsonl
}

fn collect_openclaw_jsonl_files(dir: &Path, out: &mut Vec<PathBuf>) {
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            collect_openclaw_jsonl_files(&path, out);
        } else if is_session_transcript(&path) {
            out.push(path);
        }
    }
}

fn tool_call_arguments_path(item: &Value) -> Option<String> {
    if item.get("type").and_then(Value::as_str) != Some("toolCall") {
        return None;
    }
    if item.get("name").and_then(Value::as_str) != Some("read") {
        return None;
    }

    let arguments = item.get("arguments")?;
    if let Some(path) = arguments.get("path").and_then(Value::as_str) {
        return Some(path.to_string());
    }

    let parsed = serde_json::from_str::<Value>(arguments.as_str()?).ok()?;
    parsed
        .get("path")
        .and_then(Value::as_str)
        .map(ToOwned::to_owned)
}

fn count_openclaw_skill_reads(
    value: &Value,
    allowed_longest_first: &[String],
    counts: &mut HashMap<String, u64>,
) {
    if value.get("type").and_then(Value::as_str) != Some("message") {
        return;
    }

    let Some(message) = value.get("message") else {
        return;
    };
    if message.get("role").and_then(Value::as_str) != Some("assistant") {
        return;
    }

    let Some(content) = message.get("content").and_then(Value::as_array) else {
        return;
    };

    for item in content {
        let Some(read_path) = tool_call_arguments_path(item) else {
            continue;
        };
        if !read_path.ends_with("SKILL.md") {
            continue;
        }

        let normalized = normalize_skill_md_path(&read_path);
        if let Some(hit) = allowed_longest_first
            .iter()
            .find(|path| **path == normalized)
        {
            *counts.entry(hit.clone()).or_default() += 1;
        }
    }
}

fn scan_one_openclaw_jsonl(
    path: &Path,
    allowed_longest_first: &[String],
    counts: &mut HashMap<String, u64>,
) -> Result<(), std::io::Error> {
    let file = File::open(path)?;
    let reader = BufReader::new(file);

    for line in reader.lines() {
        let line = line?;
        if let Ok(value) = serde_json::from_str::<Value>(&line) {
            count_openclaw_skill_reads(&value, allowed_longest_first, counts);
        }
    }

    Ok(())
}

pub fn scan_openclaw_session_jsonl(
    allowed_longest_first: &[String],
) -> (HashMap<String, u64>, Vec<String>) {
    let mut notes = Vec::new();
    if allowed_longest_first.is_empty() {
        return (HashMap::new(), notes);
    }

    let roots = unique_existing_roots();
    if roots.is_empty() {
        notes.push("OpenClaw: ~/.openclaw and ~/.qclaw not found".to_string());
        return (HashMap::new(), notes);
    }

    let mut files = Vec::new();
    for root in &roots {
        collect_openclaw_jsonl_files(&root.join("agents"), &mut files);
    }

    if files.is_empty() {
        notes.push("OpenClaw: no agent session .jsonl transcripts".to_string());
        return (HashMap::new(), notes);
    }

    files.sort();
    files.dedup();

    let mut counts = HashMap::new();
    let mut failures = 0usize;
    for path in &files {
        if let Err(e) = scan_one_openclaw_jsonl(path, allowed_longest_first, &mut counts) {
            failures += 1;
            notes.push(format!("{} ({e})", path.display()));
        }
    }

    if failures == 0 {
        notes.push(format!(
            "OpenClaw: scanned {} session file(s), counted read tool calls for SKILL.md only",
            files.len()
        ));
    }

    (counts, notes)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn read_tool_call_counts_exact_skill_md_path() {
        let allowed = vec![normalize_skill_md_path("~/skills/dws/SKILL.md")];
        let value = serde_json::json!({
            "type": "message",
            "message": {
                "role": "assistant",
                "content": [{
                    "type": "toolCall",
                    "name": "read",
                    "arguments": { "path": "~/skills/dws/SKILL.md" }
                }]
            }
        });
        let mut counts = HashMap::new();

        count_openclaw_skill_reads(&value, &allowed, &mut counts);

        assert_eq!(counts.get(&allowed[0]), Some(&1));
    }

    #[test]
    fn write_tool_call_does_not_count_as_skill_load() {
        let allowed = vec![normalize_skill_md_path("~/skills/dws/SKILL.md")];
        let value = serde_json::json!({
            "type": "message",
            "message": {
                "role": "assistant",
                "content": [{
                    "type": "toolCall",
                    "name": "write",
                    "arguments": { "path": "~/skills/dws/SKILL.md" }
                }]
            }
        });
        let mut counts = HashMap::new();

        count_openclaw_skill_reads(&value, &allowed, &mut counts);

        assert!(counts.is_empty());
    }
}
