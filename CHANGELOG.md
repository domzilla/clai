# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-01-25

### Added
- Initial implementation of clai - AI-powered shell command generator
- Multi-provider support with dynamic model fetching and fallback
- Providers: OpenAI, Anthropic, Google, xAI (Grok)
- Interactive setup wizard with horizontal tabs UI built on Ink
- Shell integration for bash, zsh, and fish with `shell` command
- Quiet mode (`-q`) for reduced output and optimized token usage
- Raw mode (`--raw`) for debugging LLM responses
- Clipboard copy functionality in quiet mode
- Custom model input with API validation and provider-specific placeholders
- Config commands: `config model` and `config provider`
- Per-provider default model storage
- Cancel option in setup wizard
- Centralized color scheme for consistent terminal output
- Spinner while fetching models
- JSDoc documentation for all public APIs
- MIT License
- Project documentation

### Changed
- Refactored UI from @inquirer/prompts to Ink with horizontal tabs navigation
- Switched config file format from JSON to TOML (using smol-toml)
- Moved config path to XDG location (`~/.config/clai`)
- Renamed `init` command to `shell`
- Renamed CLAUDE.md to AGENTS.md with symlink
- Replaced Groq provider with xAI (Grok)
- Use lowercase "clai" in all user-facing output
- Improved model filtering with comprehensive exclusion list (dated variants, snapshots)
- Limited model lists to 15 models maximum
- Improved first-run and missing prompt UX
- Improved provider removal flow with new default selection
- Improved model not found error message
- Shell detection now uses parent process
- Applied code style guide with ESLint and Prettier
- Refactored architecture to eliminate code duplication
- Added strict TypeScript options

### Fixed
- Recursive copy in bottle creation by using /tmp
- Truncated LLM responses by setting max_tokens
- JSON parsing for responses wrapped in markdown code fences
- Quiet mode cd prefix issue
- Skip clipboard copy in quiet mode when stdout is piped
- LLM.js provider communication
- Wizard showing missing prompt message after setup
- Active text color using proper styling

### Security
- Set secure permissions on config file and directory
