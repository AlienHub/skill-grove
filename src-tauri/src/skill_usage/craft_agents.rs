use serde::Deserialize;
use serde_json::Value;
use std::{
    collections::{HashMap, HashSet},
    fs::{self, File},
    io::{BufRead, BufReader},
    path::{Path, PathBuf},
};

#[derive(Debug, Deserialize)]
struct CraftAgentWorkspaceConfig {
    #[serde(rename = "rootPath")]
    root_path: Option<String>,
}

#[derive(Debug, Deserialize)]
struct CraftAgentConfig {
    workspaces: Option<Vec<CraftAgentWorkspaceConfig>>,
}

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

fn normalize_craft_path(path: &str, workspace_roots: &[PathBuf]) -> String {
    let trimmed = path.trim().trim_matches(|c| matches!(c, '\'' | '"'));
    let absolute_like = trimmed
        .strip_prefix("./Users/")
        .map(|rest| format!("/Users/{rest}"))
        .or_else(|| {
            trimmed
                .strip_prefix(".//Users/")
                .map(|rest| format!("/Users/{rest}"))
        });
    let expanded = expand_home_path(absolute_like.as_deref().unwrap_or(trimmed));

    let candidates: Vec<PathBuf> = if expanded.is_absolute() {
        vec![expanded]
    } else {
        let mut paths = Vec::with_capacity(workspace_roots.len() + 1);
        paths.push(expanded.clone());
        paths.extend(workspace_roots.iter().map(|root| root.join(&expanded)));
        paths
    };

    for candidate in &candidates {
        if let Ok(canonical) = candidate.canonicalize() {
            return slashify_path(&canonical.to_string_lossy());
        }
    }

    slashify_path(&candidates[0].to_string_lossy())
}

fn read_workspace_roots() -> Vec<PathBuf> {
    let config_path = home_dir().join(".craft-agent").join("config.json");
    let Ok(raw) = fs::read_to_string(config_path) else {
        return Vec::new();
    };
    let Ok(config) = serde_json::from_str::<CraftAgentConfig>(&raw) else {
        return Vec::new();
    };

    let mut seen = HashSet::new();
    let mut roots = Vec::new();
    for workspace in config.workspaces.unwrap_or_default() {
        let Some(root_path) = workspace.root_path.as_deref() else {
            continue;
        };
        let trimmed = root_path.trim();
        if trimmed.is_empty() {
            continue;
        }

        let expanded = expand_home_path(trimmed);
        let absolute = if expanded.is_absolute() {
            expanded
        } else {
            home_dir().join(expanded)
        };
        let canonical = absolute.canonicalize().unwrap_or(absolute);
        let key = slashify_path(&canonical.to_string_lossy());
        if seen.insert(key) {
            roots.push(canonical);
        }
    }

    roots
}

fn collect_craft_session_files(workspace_root: &Path, out: &mut Vec<PathBuf>) {
    let sessions_dir = workspace_root.join("sessions");
    let Ok(entries) = fs::read_dir(sessions_dir) else {
        return;
    };

    for entry in entries.flatten() {
        let path = entry.path().join("session.jsonl");
        if path.is_file() {
            out.push(path);
        }
    }
}

fn command_name(cmd: &str) -> Option<&str> {
    cmd.split_whitespace()
        .find(|part| !part.contains('=') && !part.starts_with('-'))
        .map(|part| {
            let trimmed = part.trim_matches(|c| matches!(c, '\'' | '"' | '(' | ')'));
            trimmed.rsplit('/').next().unwrap_or(trimmed)
        })
}

fn is_direct_skill_file_reader(cmd: &str) -> bool {
    matches!(
        command_name(cmd),
        Some("cat" | "sed" | "head" | "tail" | "nl" | "bat" | "less" | "more")
    )
}

fn command_contains_skill_path(cmd: &str, skill_path: &str) -> bool {
    let normalized_cmd = slashify_path(cmd);
    if normalized_cmd.contains(skill_path) || normalized_cmd.contains(&format!(".{skill_path}")) {
        return true;
    }

    let home = slashify_path(&home_dir().to_string_lossy());
    let Some(rest) = skill_path.strip_prefix(&format!("{home}/")) else {
        return false;
    };
    normalized_cmd.contains(&format!("~/{rest}"))
}

fn command_hits_allowed_skill(cmd: &str, allowed_longest_first: &[String]) -> Vec<String> {
    if !is_direct_skill_file_reader(cmd) {
        return Vec::new();
    }

    allowed_longest_first
        .iter()
        .filter(|path| command_contains_skill_path(cmd, path))
        .cloned()
        .collect()
}

fn craft_tool_name(value: &Value) -> Option<&str> {
    value.get("toolName").and_then(Value::as_str)
}

fn craft_tool_input(value: &Value) -> Option<&Value> {
    value.get("toolInput")
}

fn read_path_from_tool(value: &Value) -> Option<&str> {
    let input = craft_tool_input(value)?;
    input
        .get("file_path")
        .or_else(|| input.get("path"))
        .and_then(Value::as_str)
}

fn bash_command_from_tool(value: &Value) -> Option<&str> {
    craft_tool_input(value)?
        .get("command")
        .and_then(Value::as_str)
}

fn count_craft_skill_loads(
    value: &Value,
    allowed_longest_first: &[String],
    workspace_roots: &[PathBuf],
    counts: &mut HashMap<String, u64>,
) {
    if value.get("type").and_then(Value::as_str) != Some("tool") {
        return;
    }

    let Some(tool_name) = craft_tool_name(value) else {
        return;
    };

    if tool_name.eq_ignore_ascii_case("Read") {
        let Some(read_path) = read_path_from_tool(value) else {
            return;
        };
        if !read_path.ends_with("SKILL.md") {
            return;
        }

        let normalized = normalize_craft_path(read_path, workspace_roots);
        if let Some(hit) = allowed_longest_first
            .iter()
            .find(|path| **path == normalized)
        {
            *counts.entry(hit.clone()).or_default() += 1;
        }
        return;
    }

    if tool_name.eq_ignore_ascii_case("Bash") {
        let Some(command) = bash_command_from_tool(value) else {
            return;
        };
        for hit in command_hits_allowed_skill(command, allowed_longest_first) {
            *counts.entry(hit).or_default() += 1;
        }
    }
}

fn scan_one_craft_session_jsonl(
    path: &Path,
    allowed_longest_first: &[String],
    workspace_roots: &[PathBuf],
    counts: &mut HashMap<String, u64>,
) -> Result<(), std::io::Error> {
    let file = File::open(path)?;
    let reader = BufReader::new(file);

    for line in reader.lines() {
        let line = line?;
        if let Ok(value) = serde_json::from_str::<Value>(&line) {
            count_craft_skill_loads(&value, allowed_longest_first, workspace_roots, counts);
        }
    }

    Ok(())
}

fn craft_log_message(value: &Value) -> Option<String> {
    let message = value.get("message")?;
    if let Some(text) = message.as_str() {
        return Some(text.to_string());
    }

    Some(
        message
            .as_array()?
            .iter()
            .filter_map(Value::as_str)
            .collect::<Vec<_>>()
            .join(" "),
    )
}

fn extract_prerequisite_path(message: &str) -> Option<&str> {
    const READ_MARKER: &str = "Prerequisite: tracked read of ";
    const BASH_MARKER: &str = "Prerequisite: cleared skill prerequisite via Bash: ";
    for marker in [READ_MARKER, BASH_MARKER] {
        if let Some(rest) = message.split(marker).nth(1) {
            return rest.split_whitespace().next();
        }
    }

    None
}

fn scan_craft_main_log_fallback(
    allowed_longest_first: &[String],
    workspace_roots: &[PathBuf],
    counts: &mut HashMap<String, u64>,
) -> Result<bool, std::io::Error> {
    let path = home_dir()
        .join("Library")
        .join("Logs")
        .join("@craft-agent")
        .join("electron")
        .join("main.log");
    if !path.is_file() {
        return Ok(false);
    }

    let file = File::open(path)?;
    let reader = BufReader::new(file);
    for line in reader.lines() {
        let line = line?;
        let Ok(value) = serde_json::from_str::<Value>(&line) else {
            continue;
        };
        let Some(message) = craft_log_message(&value) else {
            continue;
        };
        let Some(read_path) = extract_prerequisite_path(&message) else {
            continue;
        };
        if !read_path.ends_with("SKILL.md") {
            continue;
        }

        let normalized = normalize_craft_path(read_path, workspace_roots);
        if let Some(hit) = allowed_longest_first
            .iter()
            .find(|path| **path == normalized)
        {
            *counts.entry(hit.clone()).or_default() += 1;
        }
    }

    Ok(true)
}

pub fn scan_craft_agents_session_jsonl(
    allowed_longest_first: &[String],
) -> (HashMap<String, u64>, Vec<String>) {
    let mut notes = Vec::new();
    if allowed_longest_first.is_empty() {
        return (HashMap::new(), notes);
    }

    let workspace_roots = read_workspace_roots();
    if workspace_roots.is_empty() {
        notes.push("Craft Agents: ~/.craft-agent/config.json has no local workspaces".to_string());
        return (HashMap::new(), notes);
    }

    let mut files = Vec::new();
    for root in &workspace_roots {
        collect_craft_session_files(root, &mut files);
    }
    files.sort();
    files.dedup();

    let mut counts = HashMap::new();
    if files.is_empty() {
        match scan_craft_main_log_fallback(allowed_longest_first, &workspace_roots, &mut counts) {
            Ok(true) => notes.push(
                "Craft Agents: scanned main.log fallback, counted prerequisite SKILL.md reads only"
                    .to_string(),
            ),
            Ok(false) => notes.push("Craft Agents: no session.jsonl transcripts".to_string()),
            Err(e) => notes.push(format!("Craft Agents: main.log fallback failed ({e})")),
        }
        return (counts, notes);
    }

    let mut failures = 0usize;
    for path in &files {
        if let Err(e) =
            scan_one_craft_session_jsonl(path, allowed_longest_first, &workspace_roots, &mut counts)
        {
            failures += 1;
            notes.push(format!("{} ({e})", path.display()));
        }
    }

    if failures == 0 {
        notes.push(format!(
            "Craft Agents: scanned {} session file(s), counted Read/direct Bash SKILL.md loads only",
            files.len()
        ));
    }

    (counts, notes)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn read_tool_counts_craft_absolute_path_format() {
        let allowed = vec!["/Users/alice/.agents/skills/dws/SKILL.md".to_string()];
        let value = serde_json::json!({
            "type": "tool",
            "toolName": "Read",
            "toolInput": {
                "file_path": "./Users/alice/.agents/skills/dws/SKILL.md"
            }
        });
        let mut counts = HashMap::new();

        count_craft_skill_loads(&value, &allowed, &[], &mut counts);

        assert_eq!(counts.get(&allowed[0]), Some(&1));
    }

    #[test]
    fn write_tool_does_not_count_as_skill_load() {
        let allowed = vec!["/Users/alice/.agents/skills/dws/SKILL.md".to_string()];
        let value = serde_json::json!({
            "type": "tool",
            "toolName": "Write",
            "toolInput": {
                "file_path": "./Users/alice/.agents/skills/dws/SKILL.md"
            }
        });
        let mut counts = HashMap::new();

        count_craft_skill_loads(&value, &allowed, &[], &mut counts);

        assert!(counts.is_empty());
    }

    #[test]
    fn direct_bash_reader_counts_skill_load() {
        let allowed = vec!["/tmp/skills/dws/SKILL.md".to_string()];
        let hits = command_hits_allowed_skill("cat /tmp/skills/dws/SKILL.md", &allowed);

        assert_eq!(hits, allowed);
    }

    #[test]
    fn search_command_does_not_count_as_skill_load() {
        let allowed = vec!["/tmp/skills/dws/SKILL.md".to_string()];
        let hits = command_hits_allowed_skill("rg dws /tmp/skills/dws/SKILL.md", &allowed);

        assert!(hits.is_empty());
    }
}
