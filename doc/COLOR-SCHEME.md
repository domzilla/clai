# CLAI Color Scheme

## Overview

This document defines the consistent color scheme used throughout CLAI's terminal output. All colors are implemented via the centralized `src/ui/colors.ts` module.

## Design Principles

1. **Semantic meaning** - Colors convey meaning, not decoration
2. **Accessibility** - Sufficient contrast for readability
3. **Consistency** - Same color for same purpose everywhere
4. **Restraint** - Limited palette to avoid visual noise

## Color Palette

### Primary Colors

| Name | Chalk Function | Usage |
|------|----------------|-------|
| **Brand** | `cyan` | App name, section headers, titles |
| **Success** | `green` | Success messages, confirmations, positive status |
| **Warning** | `yellow` | Warnings, cautions, missing items |
| **Error** | `red` | Errors, failures, high-risk indicators |

### Text Colors

| Name | Chalk Function | Usage |
|------|----------------|-------|
| **Primary** | `white` | Main text, labels, standard output |
| **Secondary** | `white` | Supporting text, hints, tips, examples |
| **Emphasis** | `bold` | Important values, highlighted text |
| **Command** | `cyan` | Commands user should run |
| **Code** | `blue` | Code snippets, shell integration scripts |

### Semantic Styles

| Style | Chalk Function | Usage |
|-------|----------------|-------|
| **Header** | `bold.cyan` | Section titles, major headings |
| **Label** | `white` | Labels before values (e.g., "Provider:") |
| **Value** | `bold` | Configuration values, important data |
| **Hint** | `white` | Helpful tips, suggestions, secondary info |

### Risk Levels

| Level | Chalk Function | Icon |
|-------|----------------|------|
| **Low** | `green` | ● |
| **Medium** | `yellow` | ● |
| **High** | `red` | ● |

## Usage Guidelines

### DO

- Use `colors.header()` for section titles
- Use `colors.success()` for success messages
- Use `colors.warning()` for warnings
- Use `colors.error()` for errors
- Use `colors.hint()` for tips and secondary information
- Use `colors.command()` for commands the user should execute
- Use `colors.code()` for code blocks and snippets

### DON'T

- Don't use `chalk.dim` - it has poor contrast
- Don't mix raw chalk calls with color utility functions
- Don't use colors purely for decoration
- Don't use more than 2-3 colors in a single message

## Examples

### Success Message
```typescript
console.log(colors.success('Configuration saved successfully!'));
```

### Warning with Hint
```typescript
console.log(colors.warning('Missing prompt.'));
console.log(colors.hint('Example: clai "list all files"'));
```

### Header with Content
```typescript
console.log(colors.header('CLAI Configuration'));
console.log(colors.label('Provider:') + ' ' + colors.value('OpenAI'));
```

### Error Message
```typescript
console.log(colors.error('Invalid provider: foo'));
console.log(colors.hint('Valid providers: openai, anthropic, gemini, xai'));
```

## Implementation

All colors are exported from `src/ui/colors.ts`:

```typescript
import { colors } from '../ui/colors.js';

// Use semantic functions
colors.header('Title')      // Bold cyan
colors.success('Done!')     // Green
colors.warning('Caution')   // Yellow
colors.error('Failed')      // Red
colors.hint('Tip: ...')     // White
colors.command('npm start') // Cyan
colors.code('const x = 1')  // Blue
colors.label('Name:')       // White
colors.value('John')        // Bold
```
