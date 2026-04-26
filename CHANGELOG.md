# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-01-25

### Added
- Initial release of clai, an AI-powered shell command generator.
- Multi-provider support for OpenAI, Anthropic, Google, and xAI (Grok), with dynamic model fetching and fallback.
- Interactive setup wizard with horizontal tabs UI.
- Shell integration for bash, zsh, and fish via the `shell` command.
- Quiet mode (`-q`) for reduced output and clipboard copy of the generated command.
- Raw mode (`--raw`) for debugging LLM responses.
- Custom model input with API validation and provider-specific placeholders.
- `config model` and `config provider` commands, plus per-provider default model storage.
- `--version` flag and spinner while fetching models.

### Changed
- Switched config file format from JSON to TOML and moved its location to `~/.config/clai`.
- Renamed the `init` command to `shell`.
- Improved model filtering with a comprehensive exclusion list and a 15-model cap.
- Shell detection now uses the parent process for accuracy.

### Fixed
- LLM responses are no longer truncated mid-output.
- JSON parsing now handles responses wrapped in markdown code fences.
- Quiet mode no longer prepends a stray `cd` and skips clipboard copy when stdout is piped.
- Setup wizard no longer shows a stale "missing prompt" message after completion.

### Security
- Config file and directory are now created with restrictive permissions.
