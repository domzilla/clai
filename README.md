# clai

AI-powered shell command generator. Describe what you want to do in plain English, get the exact command.

## Features

- **Natural language to shell commands** - Just describe what you need
- **Multiple AI providers** - OpenAI, Anthropic (Claude), Google Gemini, xAI (Grok)
- **Cross-platform** - Works on Windows, macOS, and Linux
- **Smart context** - Detects your OS and shell for accurate commands
- **Multiple options** - Get several command alternatives to choose from
- **Risk indicators** - Commands are marked as low/medium/high risk
- **Shell integration** - Optional keybinding to generate commands inline

## Installation

```bash
# Clone and install
git clone https://github.com/yourusername/clai.git
cd clai
npm install
npm run build

# Link globally
npm link
```

## Quick Start

```bash
# First run will prompt for API key setup
clai "list all files larger than 100MB"
```

The setup wizard will guide you through:
1. Selecting your AI provider
2. Entering your API key
3. Choosing a default model

## Usage

### Basic Usage

```bash
# Generate a command
clai "find all duplicate files in current directory"

# Use a specific provider
clai -p anthropic "compress all images in this folder"

# Use a specific model
clai -m gpt-4o "show disk usage by folder"

# Get more options
clai -n 5 "list running processes sorted by memory"

# Verbose mode (show explanations)
clai -v "set up a git pre-commit hook"

# Quiet mode (output command only, no menu)
clai -q "count lines of code"
```

### Configuration

```bash
# Show current config
clai config show

# Manage providers (add, update, remove, set default)
clai config provider

# Change model for a provider
clai config model

# Re-run setup wizard
clai config wizard

# Reset to defaults
clai config reset
```

### Shell Integration (Optional)

For a seamless experience, you can set up shell integration. This lets you type a description directly in your terminal and press a key to generate the command.

```bash
# Show setup instructions for your shell
clai init

# Or specify a shell
clai init zsh
clai init bash
clai init fish
clai init powershell
```

**How it works after setup:**
1. Type: `list files by size`
2. Press: `Alt+a`
3. Select a command from the menu
4. The command appears in your prompt
5. Press `Enter` to execute

## Supported Providers

| Provider | Models |
|----------|--------|
| OpenAI | gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo |
| Anthropic | claude-3-5-sonnet, claude-3-5-haiku, claude-3-opus |
| Google | gemini-2.0-flash, gemini-1.5-pro, gemini-1.5-flash |
| xAI | grok-3, grok-3-fast, grok-2, grok-2-vision |

## Environment Variables

API keys can be set via environment variables (takes priority over config file):

```bash
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
export GOOGLE_API_KEY="..."
export XAI_API_KEY="xai-..."
```

## How It Works

1. **System Detection** - CLAI detects your OS (Windows/macOS/Linux) and shell (bash/zsh/fish/PowerShell)
2. **Context Building** - Your request is combined with system info to create a prompt
3. **AI Generation** - The prompt is sent to your chosen AI provider
4. **Command Selection** - You pick from multiple command options
5. **Output** - The command is copied to clipboard and/or output to stdout

## Examples

```bash
# File operations
clai "rename all .jpeg files to .jpg"
clai "find files modified in the last 24 hours"
clai "delete all node_modules folders recursively"

# System info
clai "show top 10 processes by CPU usage"
clai "display disk space usage"
clai "list all open network ports"

# Git operations
clai "undo the last commit but keep changes"
clai "show commits from last week"
clai "create a branch from a specific commit"

# Text processing
clai "count occurrences of 'error' in all log files"
clai "replace tabs with spaces in all .py files"
clai "extract email addresses from a file"
```

## Configuration File

Configuration is stored in `~/.clai/config.json`:

```json
{
  "defaultProvider": "openai",
  "defaultModel": "gpt-4o-mini",
  "apiKeys": {
    "openai": "sk-..."
  },
  "preferences": {
    "commandCount": 3,
    "showExplanations": true
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run in development mode
npm run dev -- "your prompt here"

# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## License

MIT
