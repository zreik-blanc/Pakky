import { exec, execFile } from 'node:child_process'
import { promisify } from 'node:util'

// Promisified exec for general command execution
export const execAsync = promisify(exec)

// Promisified execFile for safe command execution (prevents shell injection)
export const execFileAsync = promisify(execFile)
