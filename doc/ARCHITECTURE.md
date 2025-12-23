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
│   ├── schema.ts         # TypeScript interfaces and shared type constants
│   ├── defaults.ts       # Default values, model lists, and helper functions
│   └── manager.ts        # Config persistence (read/write ~/.clai/config)
├── providers/
│   ├── llm.ts            # LLM.js wrapper for AI provider communication
│   └── models.ts         # Hybrid model fetcher (dynamic API + fallback)
├── services/
│   └── model-service.ts  # Model service (abstracts config + provider access)
├── prompts/
│   ├── templates.ts      # System and user prompt templates
│   └── builder.ts        # Prompt construction with system info injection
├── system/
│   └── detector.ts       # OS and shell detection
├── ui/
│   ├── colors.ts         # Centralized terminal color utilities
│   ├── selector.ts       # Command selection facade
│   ├── wizard.ts         # Setup wizard facade and helper functions
│   ├── components/
│   │   ├── base/         # Reusable ink components
│   │   │   ├── Tabs.tsx          # Horizontal tab navigation
│   │   │   ├── Select.tsx        # Vertical list selection
│   │   │   ├── TextInput.tsx     # Text input with cursor
│   │   │   ├── PasswordInput.tsx # Masked password input
│   │   │   ├── NumberInput.tsx   # Number input with validation
│   │   │   └── Spinner.tsx       # Animated loading indicator
│   │   └── domain/       # Domain-specific components
│   │       ├── ProviderSelector.tsx
│   │       ├── ModelSelector.tsx
│   │       ├── CommandSelector.tsx
│   │       └── ApiKeyInput.tsx
│   ├── screens/          # Full-screen ink applications
│   │   ├── CommandPicker.tsx     # Command selection after generation
│   │   ├── ModelManager.tsx      # Model selection with provider tabs
│   │   ├── ProviderManager.tsx   # Provider management with action tabs
│   │   └── SetupWizard.tsx       # First-run setup wizard
│   ├── hooks/            # Shared React hooks
│   │   ├── useKeyboardNav.ts     # Arrow key navigation
│   │   └── useExit.ts            # Escape/Ctrl+C handling
│   └── utils/            # UI utilities
│       ├── render.ts             # ink render wrapper with Promise
│       ├── theme.ts              # Theme configuration
│       └── types.ts              # Shared UI types
├── shell/
│   └── integration.ts    # Shell integration snippets for bash/zsh/fish/powershell
└── utils/
    └── errors.ts         # Shared error handling utilities
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
- `provider`: Manage providers (add, update, remove, set default)
- `model`: Change model for a provider
- `wizard`: Re-run setup wizard
- `reset`: Reset to defaults

**commands/init.ts**: Shell integration
- Auto-detect or accept shell argument
- Display setup instructions (never modifies files)

### 3. Configuration Layer (`src/config/`)

**schema.ts**: Type definitions and constants
```typescript
interface ClaiConfig {
  defaultProvider: 'openai' | 'anthropic' | 'gemini' | 'xai';
  defaultModel: string;
  apiKeys: { [provider]: string };
  preferences: { commandCount: number; showExplanations: boolean };
}

type RiskLevel = 'low' | 'medium' | 'high';
const RISK_LEVELS: RiskLevel[];
```

**manager.ts**: Singleton `ConfigManager` class
- Reads/writes `~/.clai/config` (TOML format)
- Checks environment variables for API keys first
- Provides typed getters/setters
- Uses `createDefaultConfig()` helper for deep copying

**defaults.ts**: Static data and helpers
- Default configuration values
- Available models per provider
- API key URLs for each provider
- `PROVIDER_ENV_VAR_NAMES`: Maps providers to environment variable names
- `createDefaultConfig()`: Creates deep copy of default config

### 4. AI Provider Layer (`src/providers/`)

**llm.ts**: Wraps LLM.js library
- Sets API key in environment for LLM.js
- Constructs model identifier with provider prefix
- Parses JSON response into `GeneratedCommand[]`
- Validates risk levels
- Uses `configManager.getModelWithFallback()` for model resolution

**models.ts**: Hybrid model fetcher
- Fetches available models from provider APIs (OpenAI, xAI, Gemini)
- Falls back to `PROVIDER_MODELS` from `defaults.ts` for providers without models API (Anthropic)
- Caches results for 1 hour to avoid repeated API calls
- Filters results to only include text generation models using `filterAndSortModels()`
- Uses `fetchFromProviderApi()` utility for consistent API calls
- Exports `getModels()` (async), `getModelsSync()` (fallback only), and `validateModel()`

### 5. Services Layer (`src/services/`)

**model-service.ts**: Abstracts model operations for UI screens
- `fetchModelsForProvider(provider, apiKey?)`: Fetches models with automatic API key resolution
- `validateModelForProvider(provider, model)`: Validates model via API
- `fetchModelsForProviders(providers)`: Batch fetch for multiple providers
- Encapsulates config manager and provider access, improving separation of concerns

### 6. Prompt Layer (`src/prompts/`)

**templates.ts**: Prompt templates with placeholders
- System prompt: Includes OS, shell, CWD, command count, JSON format instructions
- User prompt: Wraps user's natural language request

**builder.ts**: Template interpolation
- Replaces placeholders with actual system info
- Returns complete prompts ready for AI

### 7. System Detection (`src/system/`)

**detector.ts**: Platform detection
- Detects OS: windows | macos | linux
- Detects shell: bash | zsh | fish | powershell | cmd
- Provides shell-specific info (separators, null device)
- Returns config file paths for each shell

### 8. UI Layer (`src/ui/`)

The UI layer uses **ink** (React for CLI) for interactive terminal interfaces with horizontal tab navigation.

**Component Architecture**:
- **Base Components** (`components/base/`): Reusable UI primitives
  - `Tabs`: Horizontal tab navigation (←/→ arrows)
  - `Select`: Vertical list selection (↑/↓ arrows)
  - `TextInput`, `PasswordInput`, `NumberInput`: Input components
  - `Spinner`: Animated loading indicator

- **Domain Components** (`components/domain/`): Business-specific components
  - `ProviderSelector`: Provider selection list
  - `ModelSelector`: Model selection for a provider
  - `CommandSelector`: Command list with risk badges
  - `ApiKeyInput`: API key entry with URL hint

- **Screens** (`screens/`): Full-screen ink applications
  - `CommandPicker`: Command selection after generation
  - `ModelManager`: Model selection with provider tabs
  - `ProviderManager`: Provider management with action tabs [Add][Update][Remove][Set Default]
  - `SetupWizard`: First-run setup with step indicator tabs

- **Hooks** (`hooks/`): Shared React hooks
  - `useKeyboardNav`: Arrow key navigation for lists and tabs
  - `useExit`: Escape/Ctrl+C cancellation handling

**Facade Layer**:
- `wizard.ts`: Exports helper functions (`selectProvider`, `enterApiKey`, `selectModel`) and `SetupWizard` class
- `selector.ts`: Exports `CommandSelector` class with `select()` and `formatForDisplay()` methods, plus risk formatting utilities (`RISK_COLORS`, `formatRiskBullet`, `formatRiskBadge`)
- `colors.ts`: Centralized chalk-based styling utilities

### 9. Shell Integration (`src/shell/`)

**integration.ts**: Shell snippets
- Pre-defined snippets for bash, zsh, fish, powershell
- `SHELL_RELOAD_COMMANDS`: Maps shells to reload commands
- `resolveTargetShell()`: Helper for shell detection
- Instructions for manual setup
- Config file paths per shell

### 10. Utilities (`src/utils/`)

**errors.ts**: Error handling utilities
- `getErrorMessage()`: Extracts message from unknown error
- `wrapError()`: Wraps error with context prefix
- `logError()`: Logs formatted error to stderr

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
`clai shell` only displays instructions; it never modifies user files. This respects user control and avoids potential issues.

### 6. Unified LLM Interface
Using LLM.js provides a single API for multiple providers, simplifying provider switching and reducing code duplication.

### 7. Centralized Constants
Shared constants like `PROVIDER_ENV_VAR_NAMES`, `RISK_LEVELS`, and `SHELL_RELOAD_COMMANDS` are defined once and reused across modules to prevent duplication and ensure consistency.

### 8. Hybrid Model Fetching
Available models are fetched dynamically from provider APIs when possible, with fallback to a curated list. This ensures users always have access to the latest models while maintaining reliability when APIs are unavailable.

## Testing Strategy

- **Unit tests**: Core modules (ConfigManager, SystemDetector, PromptBuilder)
- **Integration tests**: CLI commands via subprocess execution
- **Mocking**: LLM responses can be mocked for testing without API calls

## Dependencies

| Package | Purpose |
|---------|---------|
| @themaximalist/llm.js | Unified AI provider API |
| commander | CLI framework |
| ink | React for CLI (terminal UI) |
| react | React runtime for ink |
| chalk | Terminal styling (via colors.ts) |
| clipboardy | Clipboard access |
| smol-toml | TOML config parsing |
