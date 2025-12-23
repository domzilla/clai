# clai

CLAI is a Node.js/TypeScript CLI that generates shell commands from natural language using AI. It supports multiple providers (OpenAI, Anthropic, Gemini, xAI) and works cross-platform.

## Code Style

**IMPORTANT:** All code in this project MUST strictly follow the [Node.js Style Guide](~/Agents/Style Guides/node-js-style-guide.md). This style guide is mandatory and must be adhered to when writing, modifying, or reviewing any code in this codebase.

Before submitting any code changes, verify they conform to the style guide.

## Tech Stack

- **Language**: TypeScript (ES modules)
- **Runtime**: Node.js >= 18
- **CLI Framework**: Commander.js
- **UI Library**: ink (React for CLI)
- **AI Library**: LLM.js (@themaximalist/llm.js)
- **Testing**: Jest with ts-jest

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Entry point |
| `src/cli/program.ts` | CLI command definitions |
| `src/cli/commands/generate.ts` | Main command generation logic |
| `src/config/schema.ts` | Types and shared constants (Provider, RiskLevel) |
| `src/config/defaults.ts` | Default values, fallback models, and helper functions |
| `src/config/manager.ts` | Configuration persistence |
| `src/providers/llm.ts` | AI provider wrapper |
| `src/providers/models.ts` | Hybrid model fetcher (dynamic API + fallback) |
| `src/system/detector.ts` | OS/shell detection |
| `src/ui/colors.ts` | Centralized color utility |
| `src/ui/wizard.ts` | Setup wizard facade and helper functions |
| `src/ui/selector.ts` | Command selection facade |
| `src/ui/components/base/` | Reusable ink components (Tabs, Select, etc.) |
| `src/ui/screens/` | Full-screen ink apps (SetupWizard, ProviderManager, etc.) |
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
4. **Shell integration**: `clai shell` shows instructions only, never modifies files
5. **Model fetching**: Models are fetched dynamically from provider APIs with fallback to curated list

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

### Adding a new UI component
1. Create component in `src/ui/components/base/` (reusable) or `src/ui/components/domain/` (specific)
2. Use existing hooks (`useKeyboardNav`, `useExit`) for keyboard handling
3. Export from the appropriate `index.ts`
4. For full screens, create in `src/ui/screens/` with a `run*` function wrapper

### Adding a new screen
1. Create screen component in `src/ui/screens/`
2. Export a `run*` function that uses `renderAndWait()` from `src/ui/utils/render.ts`
3. Define result type in `src/ui/utils/types.ts`
4. Use existing domain components where possible

## Shared Constants

Centralized constants to avoid duplication:

| Constant | Location | Purpose |
|----------|----------|---------|
| `PROVIDERS` | `config/schema.ts` | List of supported providers |
| `RISK_LEVELS` | `config/schema.ts` | Valid risk level values |
| `PROVIDER_ENV_VAR_NAMES` | `config/defaults.ts` | Provider to env var mapping |
| `PROVIDER_MODELS` | `config/defaults.ts` | Fallback models per provider |
| `FALLBACK_MODELS` | `providers/models.ts` | Curated fallback model list |
| `SHELL_RELOAD_COMMANDS` | `shell/integration.ts` | Shell reload commands |
