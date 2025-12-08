/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

// Whitelisted IPC surface exposed in preload.ts
// SECURITY NOTE: shell:run has been removed to prevent arbitrary command execution
type PakkyInvokeChannel =
  | 'system:getPlatform'
  | 'system:getInfo'
  | 'system:checkHomebrew'
  | 'config:load'
  | 'config:save'
  | 'config:selectFile'
  | 'config:saveDialog'
  | 'install:start'
  | 'install:cancel'
  | 'install:getInstalled'
  | 'install:homebrew'
  | 'search:brew'
  | 'search:info'
  | 'userInput:getValues'
  | 'userInput:saveValues'
  | 'userInput:getValue'
  // 'shell:run' - REMOVED for security
  | 'shell:openExternal'
  | 'presets:list'

type PakkyOnChannel = 'install:progress' | 'install:log'

interface PakkyBridge {
  invoke<T = unknown>(channel: PakkyInvokeChannel, ...args: unknown[]): Promise<T>
  on<T = unknown>(channel: PakkyOnChannel, listener: (event: unknown, data: T) => void): string
  off(channel: PakkyOnChannel, listenerId: string): void
}

// Used in Renderer process, exposed in `preload.ts`
interface Window {
  pakky: PakkyBridge
}
