# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in Pakky, please report it responsibly:

1. **Do not** open a public GitHub issue
2. Email the maintainer or use GitHub's private vulnerability reporting
3. Include detailed steps to reproduce the issue
4. Allow reasonable time for a fix before public disclosure

## Security Architecture

Pakky implements multiple layers of security:

### Command Allowlist
All shell commands are validated against a strict allowlist before execution. Only approved commands (like `brew`, `mas`, etc.) are permitted.

See: `electron/utils/command-allowlist.ts`

### Bash Script Scanning
Before executing any bash scripts from configs, Pakky:
- Parses the script using a bash parser
- Scans for dangerous patterns (data exfiltration, privilege escalation, etc.)
- Assigns a security risk level (LOW, MEDIUM, HIGH)
- Warns users about potential risks

See: `electron/utils/security.ts`

### Context Isolation
The Electron renderer process runs with context isolation enabled:
- No direct Node.js access from the renderer
- All IPC communication goes through a secure preload bridge
- Whitelisted channels only

### Security Risk Levels

Configs are assigned risk levels based on their content:

| Level | Description |
|-------|-------------|
| LOW | Standard package installations only |
| MEDIUM | Contains custom scripts with safe patterns |
| HIGH | Contains potentially dangerous commands or patterns |

Users are warned before executing MEDIUM or HIGH risk configs.

## Best Practices for Users

1. Only import configs from trusted sources
2. Review config contents before installation
3. Pay attention to security warnings
4. Avoid configs with HIGH security risk unless you understand the scripts
