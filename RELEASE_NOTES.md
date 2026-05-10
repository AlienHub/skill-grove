# Skill Grove v0.6.1

Released: 2026-05-10

## Highlights

- **Primary skill repository:** Configure the canonical folder for skills in **Settings** (default `~/.agents/skills`). The path is stored in `~/.agents/skill-manager.json` as `primarySkillRepository` and exposed to the rest of the app.
- **Migrate to primary:** From a skill’s **Sources** section (real sources only), move the folder into the primary repository at the same relative path, then replace the original location with a symlink. The primary root must be an enabled, scanned Agent directory.
- **Settings UX:** The primary path **Save** control appears only when the field differs from the saved value; **Enter** in the field also saves.
- **Home:** The library home header uses the in-app Ripple loader instead of a static logo.

## macOS

- This release publishes a macOS DMG installer only.
- Download the `.dmg` asset below and drag Skill Grove into Applications.
- Users on v0.6.0 can use the in-app updater to install this release.
