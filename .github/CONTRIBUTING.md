# Contributing to Pakky

Thank you for your interest in contributing to Pakky! This document provides guidelines for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/Pakky.git`
3. Navigate to the app: `cd Pakky/pakky`
4. Install dependencies: `npm install`
5. Create a branch: `git checkout -b feature/your-feature-name`

## Development Setup

```bash
# Navigate to the app directory
cd pakky

# Start development server with hot reload
npm run dev

# Run tests
npm run test

# Run linting
npm run lint

# Type checking
npm run typecheck
```

## Code Style

- Follow the existing code patterns in the codebase
- Use TypeScript for all new code
- Run `npm run lint` before committing
- Run `npm run typecheck` to ensure type safety

## Testing

- Write tests for new features
- Ensure existing tests pass: `npm run test`
- Maintain minimum 40% coverage threshold
- Tests are co-located with source files (`*.test.ts`)

## Pull Request Process

1. Update documentation if needed
2. Ensure all tests pass
3. Run linting and type checking
4. Create a PR with a clear description
5. Link any related issues

## Commit Messages

Use clear, descriptive commit messages:
- `feat: add new feature`
- `fix: resolve bug in X`
- `docs: update README`
- `test: add tests for Y`
- `refactor: improve Z`

## Architecture Overview

### Process Separation
- **Renderer** (`pakky/src/`): React UI with Zustand state management
- **Main Process** (`pakky/electron/`): Electron main, IPC handlers, installers
- **Shared** (`pakky/shared/types/`): TypeScript types for both processes

### Key Directories
- `pakky/src/components/` - React components
- `pakky/src/lib/` - Utilities and business logic
- `pakky/src/stores/` - Zustand state stores
- `pakky/electron/ipc/` - IPC request handlers
- `pakky/electron/installers/` - Platform-specific installers

## Questions?

Open an issue for questions or discussions.
