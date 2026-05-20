# Skill Grove v0.6.2

Released: 2026-05-20

## Highlights

- **Skill load statistics:** Add per-agent load counts for selected skills, with Claude Code `invoked_skills` support and direct `SKILL.md` read detection for Codex, OpenClaw, and Craft Agents.
- **Craft Agents support:** Detect Craft Agents workspaces from `~/.craft-agent/config.json`, add their `skills` folders as built-in sources, and scan workspace `sessions/*/session.jsonl` for real skill loads.
- **Usage notes popover:** Show scan scope and data-source rules in a hover card that follows the active light or dark theme.
- **Documentation refresh:** Reposition README content around Skill Governance and keep the release bundle examples current.

## macOS

- This release publishes a macOS DMG installer only.
- Download the `.dmg` asset below and drag Skill Grove into Applications.
- Users on v0.6.1 can use the in-app updater to install this release.
