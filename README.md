# Skill Studio

Skill Studio is a standalone Tauri v2 app for browsing, comparing, and managing local agent skills. It scans common skill directories on the current machine, groups duplicate or symlinked skills, and shows each skill's source agent with a refined icon-driven UI.

## Features

- Browse local `SKILL.md` files in a compact desktop interface.
- Auto-discover existing built-in agent skill directories while preserving user-configured directories.
- Group the same skill across multiple sources, sorted by source count from high to low and then by skill name.
- Distinguish real files, symlink entries, and same-content variants.
- Inspect source metadata and frontmatter metadata in white tables with consistent borders and 12px table text.
- Show source agent icons using `@lobehub/icons`, with a lightning fallback for unknown agents.
- Override a source icon with a custom `.png` or `.svg`; custom icons persist across refreshes.
- Use a popover source selector for skills with many sources, avoiding horizontal tab overflow.
- Package as a macOS app with a transparent native titlebar, hidden title text, and custom app icon.

## Development

Install dependencies:

```bash
bun install
```

Run the Tauri app:

```bash
bun run tauri:dev
```

Run only the Vite browser app:

```bash
bun run dev
```

Open:

```text
http://127.0.0.1:5176
```

## Verification

```bash
bun run typecheck
bun run build
cd src-tauri && cargo check
```

The production preview uses port `5177`:

```bash
bun run preview
```

## DMG Build

```bash
bun run dmg
```

The generated `.app` is written to:

```text
src-tauri/target/release/bundle/macos/Skill Studio.app
```

On macOS 26, Tauri's built-in DMG wrapper may fail during the final `create-dmg` step. If that happens, package the generated `.app` manually:

```bash
mkdir -p /tmp/skill-studio-dmg
cp -R "src-tauri/target/release/bundle/macos/Skill Studio.app" /tmp/skill-studio-dmg/
ln -s /Applications /tmp/skill-studio-dmg/Applications
hdiutil create -volname "Skill Studio" -srcfolder /tmp/skill-studio-dmg -ov -format UDZO \
  "src-tauri/target/release/bundle/dmg/Skill Studio_0.1.0_aarch64.dmg"
```

## Skill Directories

Skill Studio stores user configuration in:

```text
~/.agents/skill-manager.json
```

Directory behavior:

- If the config file does not exist, Skill Studio scans all existing built-in candidate directories.
- If the config file exists, Skill Studio returns user-configured directories first, then appends existing built-in candidate directories that are missing from the config.
- Directories are normalized, deduplicated, and only existing directories are scanned for built-in discovery.
- Deleting a built-in directory from the UI does not permanently ignore it yet; if the directory still exists, it may be auto-added again on the next load.

Current built-in candidate directories:

```text
~/.agents/skills
~/.codex/skills
~/.claude/skills
~/.cursor/skills
~/.config/opencode/skills
~/.gemini/antigravity/skills
~/.config/agents/skills
~/.kilocode/skills
~/.roo/skills
~/.config/goose/skills
~/.gemini/skills
~/.copilot/skills
~/.openclaw/skills
~/.factory/skills
~/.codeium/windsurf/skills
~/.trae/skills
~/.deepagents/agent/skills
~/.firebender/skills
~/.augment/skills
~/.bob/skills
~/.codebuddy/skills
~/.commandcode/skills
~/.snowflake/cortex/skills
~/.config/crush/skills
~/.iflow/skills
~/.junie/skills
~/.kiro/skills
~/.kode/skills
~/.mcpjam/skills
~/.vibe/skills
~/.mux/skills
~/.neovate/skills
~/.openhands/skills
~/.pi/agent/skills
~/.pochi/skills
~/.qoder/skills
~/.qwen/skills
~/.trae-cn/skills
~/.zencoder/skills
~/.adal/skills
~/.hermes/skills
```

## Config Shape

Example `~/.agents/skill-manager.json`:

```json
{
  "skillDirectories": [
    "/Users/you/.agents/skills",
    "/Users/you/.codex/skills"
  ],
  "sourceIcons": {
    "/Users/you/.agents/skills": {
      "type": "dataUrl",
      "value": "data:image/svg+xml;base64,..."
    }
  }
}
```

`sourceIcons` is keyed by normalized source directory. Custom icons take priority over built-in `@lobehub/icons` mappings.

## App Icons And Titlebar

The app icon source is:

```text
public/app-icon.svg
```

Tauri-generated bundle icons are stored under:

```text
src-tauri/icons
```

Regenerate them from a square SVG or PNG:

```bash
bun tauri icon /path/to/icon.svg --output src-tauri/icons
```

The macOS window uses:

```json
{
  "titleBarStyle": "Transparent",
  "hiddenTitle": true,
  "backgroundColor": "#fafafa"
}
```

This keeps the native traffic-light controls while avoiding a duplicate frontend titlebar.

## Project Structure

```text
index.html                  Browser shell and favicon
public/app-icon.svg         Browser favicon source
src/pages/SkillManagerPage.tsx
                            Main React UI
src/vite-env.d.ts           Virtual module types
vite.config.ts              Vite plugin, dev/preview API, local scanner
src-tauri/src/lib.rs        Tauri commands and production scanner
src-tauri/tauri.conf.json   Tauri window and bundle config
src-tauri/icons             Generated app icons
```

## Notes

- Dev and preview modes expose the local scanner through `/__skill_manager__`.
- Production uses Tauri commands for scanning, saving directories, and saving source icons.
- `@lobehub/icons` provides agent logos where available; unknown sources use the lightning fallback.
- Large bundle warnings are expected for the current first version because the app inlines skill content through the virtual state module and imports multiple icon components.
