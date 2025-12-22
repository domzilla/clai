# clai

CLAI is a Node.js/TypeScript CLI that generates shell commands from natural language using AI. It supports multiple providers (OpenAI, Anthropic, Gemini, Groq) and works cross-platform.

## Code Style

**IMPORTANT:** All code in this project MUST strictly follow the [Node.js Style Guide](~/Agents/Style Guides/node-js-style-guide.md). This style guide is mandatory and must be adhered to when writing, modifying, or reviewing any code in this codebase.

Before submitting any code changes, verify they conform to the style guide.

## Tech Stack

- **Language**: TypeScript (ES modules)
- **Runtime**: Node.js >= 18
- **CLI Framework**: Commander.js
- **AI Library**: LLM.js (@themaximalist/llm.js)
- **Testing**: Jest with ts-jest

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Entry point |
| `src/cli/program.ts` | CLI command definitions |
| `src/cli/commands/generate.ts` | Main command generation logic |
| `src/config/schema.ts` | Types and shared constants (Provider, RiskLevel) |
| `src/config/defaults.ts` | Default values and helper functions |
| `src/config/manager.ts` | Configuration persistence |
| `src/providers/llm.ts` | AI provider wrapper |
| `src/system/detector.ts` | OS/shell detection |
| `src/ui/colors.ts` | Centralized color utility |
| `src/utils/errors.ts` | Shared error handling utilities |

## Development Commands

```bash
npm run build      # Compile TypeScript
npm run dev        # Run with tsx (dev mode)
npm test           # Run tests
npm run lint       # Lint code
```

## Architecture Notes

1. **Config location**: `~/.clai/config`
2. **API keys**: Environment variables take priority over config file
3. **Output**: UI goes to stderr, command output to stdout (for shell integration)
4. **Shell integration**: `clai init` shows instructions only, never modifies files

## UI and Colors

All terminal output styling uses the centralized `colors` utility from `src/ui/colors.ts`. See `doc/COLOR-SCHEME.md` for the complete color scheme and usage guidelines.

**Never use chalk directly**—always import and use the `colors` utility for consistent styling.

## Code Style

- Use ES module imports with `.js` extensions
- Prefer `const` over `let`
- Use TypeScript strict mode
- Export singletons for managers (e.g., `export const configManager = new ConfigManager()`)

## Testing

Tests are in `tests/` directory:
- `tests/unit/` - Unit tests for individual modules
- `tests/integration/` - CLI integration tests

Run with: `npm test`

## Common Tasks

### Adding a new AI provider
1. Add provider to `Provider` type in `src/config/schema.ts`
2. Add models to `PROVIDER_MODELS` in `src/config/defaults.ts`
3. Add env var name to `PROVIDER_ENV_VAR_NAMES` in `src/config/defaults.ts`
4. Add prefix mapping in `src/providers/llm.ts`
5. Add API key URL in `src/config/defaults.ts`

### Adding a new CLI option
1. Add option in `src/cli/program.ts`
2. Update `GenerateOptions` interface in `src/cli/commands/generate.ts`
3. Handle the option in the command handler

### Adding shell support
1. Add shell type to `ShellType` in `src/system/detector.ts`
2. Add snippet to `SHELL_SNIPPETS` in `src/shell/integration.ts`
3. Add config file path to `SHELL_CONFIG_FILES`
4. Add reload command to `SHELL_RELOAD_COMMANDS`

## Shared Constants

Centralized constants to avoid duplication:

| Constant | Location | Purpose |
|----------|----------|---------|
| `PROVIDERS` | `config/schema.ts` | List of supported providers |
| `RISK_LEVELS` | `config/schema.ts` | Valid risk level values |
| `PROVIDER_ENV_VAR_NAMES` | `config/defaults.ts` | Provider to env var mapping |
| `PROVIDER_MODELS` | `config/defaults.ts` | Available models per provider |
| `SHELL_RELOAD_COMMANDS` | `shell/integration.ts` | Shell reload commands |
