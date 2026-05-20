mod claude;
mod codex;
mod craft_agents;
mod openclaw;

use serde::{Deserialize, Serialize};
use std::{
    collections::{HashMap, HashSet},
    fs,
    path::{Path, PathBuf},
};
use time::format_description::well_known::Rfc3339;

const USAGE_FILE_VERSION: u32 = 1;
const USAGE_FILENAME: &str = "skill-grove-usage.v1.json";

fn home_dir() -> PathBuf {
    dirs::home_dir().unwrap_or_else(|| PathBuf::from("."))
}

fn usage_storage_path() -> PathBuf {
    home_dir().join(".agents").join(USAGE_FILENAME)
}

#[derive(Clone, Debug, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SkillUsageSnapshot {
    pub version: u32,
    /// Total skill load counts keyed by canonical `SKILL.md` path.
    #[serde(default)]
    pub counts_by_skill_md_path: HashMap<String, u64>,
    /// Skill load counts grouped by local Agent source, then canonical `SKILL.md` path.
    #[serde(default)]
    pub counts_by_skill_md_path_by_source: HashMap<String, HashMap<String, u64>>,
    pub last_scan_at: Option<String>,
    pub scan_note: Option<String>,
}

pub fn load_skill_usage_from_disk() -> SkillUsageSnapshot {
    let path = usage_storage_path();
    let Ok(raw) = fs::read_to_string(&path) else {
        return SkillUsageSnapshot {
            version: USAGE_FILE_VERSION,
            ..Default::default()
        };
    };
    serde_json::from_str(&raw).unwrap_or(SkillUsageSnapshot {
        version: USAGE_FILE_VERSION,
        ..Default::default()
    })
}

fn write_skill_usage(snapshot: &SkillUsageSnapshot) -> Result<(), String> {
    let path = usage_storage_path();
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let raw = serde_json::to_string_pretty(snapshot).map_err(|e| e.to_string())?;
    fs::write(path, raw).map_err(|e| e.to_string())
}

fn slashify_path(p: &str) -> String {
    p.replace('\\', "/")
}

/// Build stable canonical `SKILL.md` keys for the selected skill sources.
pub fn build_allowed_skill_md_paths(resolved_skill_directories: &[String]) -> Vec<String> {
    let mut paths: HashSet<String> = HashSet::new();

    for dir in resolved_skill_directories {
        let joined = Path::new(dir).join("SKILL.md");
        if let Ok(canonical) = joined.canonicalize() {
            paths.insert(slashify_path(&canonical.to_string_lossy()));
        } else {
            paths.insert(slashify_path(&joined.to_string_lossy()));
        }
    }

    let mut list: Vec<String> = paths.into_iter().collect();
    list.sort_by_key(|p| std::cmp::Reverse(p.len()));
    list
}

fn rfc3339_now() -> String {
    time::OffsetDateTime::now_utc()
        .format(&Rfc3339)
        .unwrap_or_else(|_| "1970-01-01T00:00:00Z".to_string())
}

/// Scan local stores for **only** the given skill variants, then merge counts into the on-disk snapshot.
/// Other skills' entries in `counts_by_skill_md_path` are left unchanged.
pub fn refresh_skill_usage_for_paths(
    resolved_skill_directories: &[String],
) -> Result<SkillUsageSnapshot, String> {
    if resolved_skill_directories.is_empty() {
        return Err("没有可扫描的技能目录".to_string());
    }

    let allowed = build_allowed_skill_md_paths(resolved_skill_directories);
    if allowed.is_empty() {
        return Err("无法解析 SKILL.md 路径".to_string());
    }

    let (claude_counts, mut notes) = claude::scan_claude_project_jsonl(&allowed);
    let (codex_counts, codex_notes) = codex::scan_codex_session_jsonl(&allowed);
    notes.extend(codex_notes);
    let (openclaw_counts, openclaw_notes) = openclaw::scan_openclaw_session_jsonl(&allowed);
    notes.extend(openclaw_notes);
    let (craft_agents_counts, craft_agents_notes) =
        craft_agents::scan_craft_agents_session_jsonl(&allowed);
    notes.extend(craft_agents_notes);

    let mut snapshot = load_skill_usage_from_disk();
    snapshot.version = USAGE_FILE_VERSION;

    let claude_source = "claude-code".to_string();
    let codex_source = "codex".to_string();
    let openclaw_source = "openclaw".to_string();
    let craft_agents_source = "craft-agents".to_string();
    let claude_source_counts = snapshot
        .counts_by_skill_md_path_by_source
        .entry(claude_source)
        .or_default();
    for path in &allowed {
        let count = *claude_counts.get(path).unwrap_or(&0);
        claude_source_counts.insert(path.clone(), count);
    }

    let codex_source_counts = snapshot
        .counts_by_skill_md_path_by_source
        .entry(codex_source)
        .or_default();
    for path in &allowed {
        let count = *codex_counts.get(path).unwrap_or(&0);
        codex_source_counts.insert(path.clone(), count);
    }

    let openclaw_source_counts = snapshot
        .counts_by_skill_md_path_by_source
        .entry(openclaw_source)
        .or_default();
    for path in &allowed {
        let count = *openclaw_counts.get(path).unwrap_or(&0);
        openclaw_source_counts.insert(path.clone(), count);
    }

    let craft_agents_source_counts = snapshot
        .counts_by_skill_md_path_by_source
        .entry(craft_agents_source)
        .or_default();
    for path in &allowed {
        let count = *craft_agents_counts.get(path).unwrap_or(&0);
        craft_agents_source_counts.insert(path.clone(), count);
    }

    for path in &allowed {
        let total = snapshot
            .counts_by_skill_md_path_by_source
            .values()
            .map(|source_counts| source_counts.get(path).copied().unwrap_or(0))
            .sum();
        snapshot.counts_by_skill_md_path.insert(path.clone(), total);
    }

    snapshot.last_scan_at = Some(rfc3339_now());

    let scope_note = format!(
        "范围：当前技能 {} 个来源版本（Claude Code invoked_skills + Codex/OpenClaw/Craft Agents SKILL.md 读取，且仅更新此项，其它技能计数不变）",
        allowed.len()
    );
    notes.insert(0, scope_note);

    if let Err(e) = write_skill_usage(&snapshot) {
        notes.push(format!("persist error: {e}"));
    }

    snapshot.scan_note = if notes.is_empty() {
        None
    } else {
        Some(notes.join("; "))
    };

    Ok(snapshot)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn build_allowed_paths_sorts_longest_first() {
        let dirs = vec!["/tmp/a".to_string(), "/tmp/a/b".to_string()];
        let p = build_allowed_skill_md_paths(&dirs);
        assert!(p[0].len() >= p[p.len().saturating_sub(1)].len());
    }
}
