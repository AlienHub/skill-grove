mod claude;
mod codex;
mod craft_agents;
mod openclaw;

use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{
    collections::{HashMap, HashSet},
    fs,
    path::{Path, PathBuf},
};
use time::format_description::well_known::Rfc3339;

const USAGE_FILE_VERSION: u32 = 1;
const USAGE_FILENAME: &str = "skill-grove-usage.v1.json";
pub(crate) type UsageCounts = HashMap<String, u64>;
pub(crate) type DailyUsageCounts = HashMap<String, HashMap<String, u64>>;

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
    /// Daily skill load counts grouped by local Agent source, date, then canonical `SKILL.md` path.
    #[serde(default)]
    pub counts_by_day_by_source: HashMap<String, DailyUsageCounts>,
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

fn day_from_unix_timestamp(value: i64) -> Option<String> {
    let seconds = if value.abs() > 10_000_000_000 {
        value / 1000
    } else {
        value
    };

    time::OffsetDateTime::from_unix_timestamp(seconds)
        .ok()
        .map(|timestamp| timestamp.date().to_string())
}

fn day_from_timestamp_string(value: &str) -> Option<String> {
    let trimmed = value.trim();
    if trimmed.len() >= 10 {
        let date = &trimmed[..10];
        let bytes = date.as_bytes();
        if bytes.get(4) == Some(&b'-')
            && bytes.get(7) == Some(&b'-')
            && bytes
                .iter()
                .enumerate()
                .all(|(index, byte)| index == 4 || index == 7 || byte.is_ascii_digit())
        {
            return Some(date.to_string());
        }
    }

    time::OffsetDateTime::parse(trimmed, &Rfc3339)
        .ok()
        .map(|timestamp| timestamp.date().to_string())
}

fn day_from_json_value(value: &Value) -> Option<String> {
    if let Some(text) = value.as_str() {
        return day_from_timestamp_string(text);
    }

    if let Some(number) = value.as_i64() {
        return day_from_unix_timestamp(number);
    }

    None
}

pub(crate) fn event_day(value: &Value) -> Option<String> {
    for key in [
        "timestamp",
        "created_at",
        "createdAt",
        "time",
        "datetime",
        "date",
    ] {
        if let Some(day) = value.get(key).and_then(day_from_json_value) {
            return Some(day);
        }
    }

    for key in ["payload", "message", "metadata", "attachment"] {
        if let Some(day) = value.get(key).and_then(event_day) {
            return Some(day);
        }
    }

    None
}

pub(crate) fn count_skill_usage(
    counts: &mut UsageCounts,
    daily_counts: &mut DailyUsageCounts,
    skill_md_path: String,
    day: Option<String>,
) {
    *counts.entry(skill_md_path.clone()).or_default() += 1;

    if let Some(day) = day {
        *daily_counts
            .entry(day)
            .or_default()
            .entry(skill_md_path)
            .or_default() += 1;
    }
}

fn update_source_counts(
    snapshot: &mut SkillUsageSnapshot,
    source: &str,
    allowed: &[String],
    counts: UsageCounts,
    daily_counts: DailyUsageCounts,
) {
    let source_counts = snapshot
        .counts_by_skill_md_path_by_source
        .entry(source.to_string())
        .or_default();
    for path in allowed {
        let count = *counts.get(path).unwrap_or(&0);
        source_counts.insert(path.clone(), count);
    }

    let source_daily_counts = snapshot
        .counts_by_day_by_source
        .entry(source.to_string())
        .or_default();
    for day_counts in source_daily_counts.values_mut() {
        for path in allowed {
            day_counts.remove(path);
        }
    }
    source_daily_counts.retain(|_, day_counts| !day_counts.is_empty());

    for (day, counts_by_path) in daily_counts {
        let target_day = source_daily_counts.entry(day).or_default();
        for (path, count) in counts_by_path {
            if count > 0 {
                target_day.insert(path, count);
            }
        }
    }
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

    let (claude_counts, claude_daily_counts, mut notes) =
        claude::scan_claude_project_jsonl(&allowed);
    let (codex_counts, codex_daily_counts, codex_notes) = codex::scan_codex_session_jsonl(&allowed);
    notes.extend(codex_notes);
    let (openclaw_counts, openclaw_daily_counts, openclaw_notes) =
        openclaw::scan_openclaw_session_jsonl(&allowed);
    notes.extend(openclaw_notes);
    let (craft_agents_counts, craft_agents_daily_counts, craft_agents_notes) =
        craft_agents::scan_craft_agents_session_jsonl(&allowed);
    notes.extend(craft_agents_notes);

    let mut snapshot = load_skill_usage_from_disk();
    snapshot.version = USAGE_FILE_VERSION;

    update_source_counts(
        &mut snapshot,
        "claude-code",
        &allowed,
        claude_counts,
        claude_daily_counts,
    );
    update_source_counts(
        &mut snapshot,
        "codex",
        &allowed,
        codex_counts,
        codex_daily_counts,
    );
    update_source_counts(
        &mut snapshot,
        "openclaw",
        &allowed,
        openclaw_counts,
        openclaw_daily_counts,
    );
    update_source_counts(
        &mut snapshot,
        "craft-agents",
        &allowed,
        craft_agents_counts,
        craft_agents_daily_counts,
    );

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
        "范围：当前技能 {} 个来源版本（Claude Code invoked_skills + Codex 手动技能上下文/直接 SKILL.md 读取 + OpenClaw/Craft Agents SKILL.md 读取，且仅更新此项，其它技能计数不变）",
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

    #[test]
    fn count_skill_usage_tracks_daily_counts_from_timestamp() {
        let value = serde_json::json!({
            "timestamp": "2026-06-14T21:30:00Z"
        });
        let mut counts = UsageCounts::new();
        let mut daily_counts = DailyUsageCounts::new();

        count_skill_usage(
            &mut counts,
            &mut daily_counts,
            "/tmp/skills/dws/SKILL.md".to_string(),
            event_day(&value),
        );

        assert_eq!(counts.get("/tmp/skills/dws/SKILL.md"), Some(&1));
        assert_eq!(
            daily_counts
                .get("2026-06-14")
                .and_then(|day| day.get("/tmp/skills/dws/SKILL.md")),
            Some(&1)
        );
    }
}
