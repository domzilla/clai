# CLAI Architecture

## Overview

CLAI is a Node.js CLI application written in TypeScript that generates shell commands from natural language using AI. It follows a modular architecture with clear separation of concerns.

## Directory Structure

```
src/
├── index.ts              # Entry point, orchestrates startup flow
├── cli/
│   ├── program.ts        # Commander.js CLI definition
│   └── commands/
│       ├── generate.ts   # Main command generation logic
│       ├── config.ts     # Configuration management commands
│       └── init.ts       # Shell integration instructions
├── config/
│   ├── schema.ts         # TypeScript interfaces for configuration
│   ├── defaults.ts       # Default values and provider model lists
│   └── manager.ts        # Config persistence (read/write ~/.clai/config.json)
├── providers/
│   └── llm.ts            # LLM.js wrapper for AI provider communication
├── prompts/
│   ├── templates.ts      # System and user prompt templates
│   └── builder.ts        # Prompt construction with system info injection
├── system/
│   └── detector.ts       # OS and shell detection
├── ui/
│   ├── wizard.ts         # First-run setup wizard
│   └── selector.ts       # Interactive command selection menu
└── shell/
    └── integration.ts    # Shell integration snippets for bash/zsh/fish/powershell
```

## Core Components

### 1. Entry Point (`src/index.ts`)

Handles application startup:
- Checks if configuration exists
- Runs setup wizard on first use (for commands that need config)
- Delegates to Commander.js for command parsing

### 2. CLI Layer (`src/cli/`)

**program.ts**: Defines the CLI interface using Commander.js
- Default command: generate (accepts prompt as arguments)
- Subcommands: `config`, `init`
- Options: `--model`, `--provider`, `--count`, `--verbose`, `--quiet`

**commands/generate.ts**: Main workflow
1. Detect system info (OS, shell, cwd)
2. Build prompt with system context
3. Call AI provider
4. Display command options
5. Copy selected command to clipboard / output to stdout

**commands/config.ts**: Configuration management
- `show`: Display current configuration
- `set <key> <value>`: Update configuration
- `reset`: Reset to defaults
- `wizard`: Re-run setup wizard

**commands/init.ts**: Shell integration
- Auto-detect or accept shell argument
- Display setup instructions (never modifies files)

### 3. Configuration Layer (`src/config/`)

**schema.ts**: Type definitions
```typescript
interface ClaiConfig {
  defaultProvider: 'openai' | 'anthropic' | 'gemini' | 'groq';
  defaultModel: string;
  apiKeys: { [provider]: string };
  preferences: { commandCount: number; showExplanations: boolean };
}
```

**manager.ts**: Singleton `ConfigManager` class
- Reads/writes `~/.clai/config.json`
- Checks environment variables for API keys first
- Provides typed getters/setters
- Handles deep copying to prevent mutation of defaults

**defaults.ts**: Static data
- Default configuration values
- Available models per provider
- API key URLs for each provider

### 4. AI Provider Layer (`src/providers/`)

**llm.ts**: Wraps LLM.js library
- Sets API key in environment for LLM.js
- Constructs model identifier with provider prefix
- Parses JSON response into `GeneratedCommand[]`
- Validates risk levels

### 5. Prompt Layer (`src/prompts/`)

**templates.ts**: Prompt templates with placeholders
- System prompt: Includes OS, shell, CWD, command count, JSON format instructions
- User prompt: Wraps user's natural language request

**builder.ts**: Template interpolation
- Replaces placeholders with actual system info
- Returns complete prompts ready for AI

### 6. System Detection (`src/system/`)

**detector.ts**: Platform detection
- Detects OS: windows | macos | linux
- Detects shell: bash | zsh | fish | powershell | cmd
- Provides shell-specific info (separators, null device)
- Returns config file paths for each shell

### 7. UI Layer (`src/ui/`)

**wizard.ts**: Setup wizard using Inquirer.js
- Provider selection
- API key input (masked)
- Model selection
- Preferences configuration

**selector.ts**: Command selection
- Displays commands with descriptions and risk levels
- Color-coded risk indicators (green/yellow/red)
- Returns selected command or null on cancel

### 8. Shell Integration (`src/shell/`)

**integration.ts**: Shell snippets
- Pre-defined snippets for bash, zsh, fish, powershell
- Instructions for manual setup
- Config file paths per shell

## Data Flow

```
User Input
    │
    ▼
┌─────────────┐
│   index.ts  │──── First run? ────► Setup Wizard
└─────────────┘
    │
    ▼
┌─────────────┐
│  program.ts │ (Commander.js routing)
└─────────────┘
    │
    ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ generate.ts │────►│ detector.ts  │────►│ builder.ts  │
└─────────────┘     └──────────────┘     └─────────────┘
    │                                          │
    │                                          ▼
    │                                    ┌─────────────┐
    │                                    │   llm.ts    │
    │                                    └─────────────┘
    │                                          │
    │                                          ▼
    │                                    ┌─────────────┐
    │◄───────────────────────────────────│  AI Provider│
    │                                    └─────────────┘
    ▼
┌─────────────┐
│ selector.ts │
└─────────────┘
    │
    ▼
stdout + clipboard
```

## Key Design Decisions

### 1. ESM Modules
The project uses ES modules (`"type": "module"`) for modern JavaScript compatibility and better tree-shaking.

### 2. Deep Copy for Defaults
Configuration manager creates deep copies of default values to prevent accidental mutation of the shared defaults object.

### 3. Environment Variable Priority
API keys from environment variables take precedence over config file values, enabling CI/CD and containerized usage.

### 4. Stderr for UI, Stdout for Output
Interactive UI elements (spinner, menu) write to stderr, while the selected command writes to stdout. This enables shell integration via command substitution.

### 5. No Auto-modification of Shell Configs
`clai init` only displays instructions; it never modifies user files. This respects user control and avoids potential issues.

### 6. Unified LLM Interface
Using LLM.js provides a single API for multiple providers, simplifying provider switching and reducing code duplication.

## Testing Strategy

- **Unit tests**: Core modules (ConfigManager, SystemDetector, PromptBuilder)
- **Integration tests**: CLI commands via subprocess execution
- **Mocking**: LLM responses can be mocked for testing without API calls

## Dependencies

| Package | Purpose |
|---------|---------|
| @themaximalist/llm.js | Unified AI provider API |
| commander | CLI framework |
| @inquirer/prompts | Interactive prompts |
| chalk | Terminal styling |
| ora | Loading spinners |
| clipboardy | Clipboard access |
