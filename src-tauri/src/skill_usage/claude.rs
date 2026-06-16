use super::{count_skill_usage, event_day, DailyUsageCounts, UsageCounts};
use serde_json::Value;
use std::{
    collections::HashSet,
    fs::{self, File},
    io::{BufRead, BufReader},
    path::{Path, PathBuf},
};

fn home_dir() -> PathBuf {
    dirs::home_dir().unwrap_or_else(|| PathBuf::from("."))
}

fn collect_jsonl_files(dir: &std::path::Path, out: &mut Vec<PathBuf>) {
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

#[derive(Clone, Debug)]
struct AllowedSkill {
    skill_md_path: String,
    aliases: HashSet<String>,
}

fn normalize_alias(value: &str) -> String {
    value.trim().to_lowercase()
}

fn frontmatter_skill_name(skill_md_path: &Path) -> Option<String> {
    let source = fs::read_to_string(skill_md_path).ok()?;
    let mut lines = source.lines();
    if lines.next()? != "---" {
        return None;
    }

    let mut frontmatter = String::new();
    for line in lines {
        if line == "---" {
            break;
        }
        frontmatter.push_str(line);
        frontmatter.push('\n');
    }

    serde_yaml::from_str::<Value>(&frontmatter)
        .ok()?
        .get("name")?
        .as_str()
        .map(ToOwned::to_owned)
}

fn allowed_skills(allowed_longest_first: &[String]) -> Vec<AllowedSkill> {
    allowed_longest_first
        .iter()
        .map(|skill_md_path| {
            let path = Path::new(skill_md_path);
            let mut aliases = HashSet::new();

            if let Some(parent_name) = path
                .parent()
                .and_then(|parent| parent.file_name())
                .and_then(|name| name.to_str())
            {
                aliases.insert(normalize_alias(parent_name));
            }

            if let Some(name) = frontmatter_skill_name(path) {
                aliases.insert(normalize_alias(&name));
            }

            AllowedSkill {
                skill_md_path: skill_md_path.clone(),
                aliases,
            }
        })
        .collect()
}

fn count_invoked_skills(
    value: &Value,
    allowed: &[AllowedSkill],
    counts: &mut UsageCounts,
    daily_counts: &mut DailyUsageCounts,
) {
    let Some(skills) = value
        .get("attachment")
        .and_then(|attachment| attachment.get("skills"))
        .and_then(Value::as_array)
    else {
        return;
    };

    let day = event_day(value);
    for skill in skills {
        let Some(name) = skill.get("name").and_then(Value::as_str) else {
            continue;
        };
        let name = normalize_alias(name);
        if let Some(hit) = allowed.iter().find(|entry| entry.aliases.contains(&name)) {
            count_skill_usage(counts, daily_counts, hit.skill_md_path.clone(), day.clone());
        }
    }
}

fn scan_one_claude_jsonl(
    path: &std::path::Path,
    allowed: &[AllowedSkill],
    counts: &mut UsageCounts,
    daily_counts: &mut DailyUsageCounts,
) -> Result<(), std::io::Error> {
    let file = File::open(path)?;
    let reader = BufReader::new(file);

    for line in reader.lines() {
        let line = line?;
        if let Ok(value) = serde_json::from_str::<Value>(&line) {
            if value
                .get("attachment")
                .and_then(|attachment| attachment.get("type"))
                .and_then(Value::as_str)
                == Some("invoked_skills")
            {
                count_invoked_skills(&value, allowed, counts, daily_counts);
            }
        }
    }

    Ok(())
}

pub fn scan_claude_project_jsonl(
    allowed_longest_first: &[String],
) -> (UsageCounts, DailyUsageCounts, Vec<String>) {
    let mut notes = Vec::new();
    if allowed_longest_first.is_empty() {
        return (UsageCounts::new(), DailyUsageCounts::new(), notes);
    }
    let allowed = allowed_skills(allowed_longest_first);

    let projects = home_dir().join(".claude").join("projects");
    if !projects.is_dir() {
        notes.push("Claude Code: ~/.claude/projects not found".to_string());
        return (UsageCounts::new(), DailyUsageCounts::new(), notes);
    }

    let mut files = Vec::new();
    collect_jsonl_files(&projects, &mut files);

    if files.is_empty() {
        notes.push("Claude Code: no .jsonl transcripts".to_string());
        return (UsageCounts::new(), DailyUsageCounts::new(), notes);
    }

    let mut counts = UsageCounts::new();
    let mut daily_counts = DailyUsageCounts::new();
    let mut failures = 0usize;

    for path in &files {
        if let Err(e) = scan_one_claude_jsonl(path, &allowed, &mut counts, &mut daily_counts) {
            failures += 1;
            notes.push(format!("{} ({e})", path.display()));
        }
    }

    if failures == 0 {
        notes.push(format!(
            "Claude Code: scanned {} transcript file(s), counted invoked_skills events only",
            files.len()
        ));
    }

    (counts, daily_counts, notes)
}
