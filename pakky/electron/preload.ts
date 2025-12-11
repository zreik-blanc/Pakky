import { ipcRenderer, contextBridge, IpcRendererEvent } from 'electron'

// Only allow known-safe channels between renderer and main.
// SECURITY NOTE: shell:run has been removed to prevent arbitrary command execution
const invokeChannels = [
  'system:getPlatform',
  'system:getInfo',
  'config:load',
  'config:save',
  'config:selectFile',
  'config:saveDialog',
  'install:start',
  'install:cancel',
  'install:getInstalled',
  'install:homebrew',
  'install:checkHomebrew',
  'search:brew',
  'search:info',
  'userInput:getValues',
  'userInput:saveValues',
  'userInput:getValue',
  // 'shell:run' - REMOVED for security
  'shell:openExternal',
  'presets:list',
  'userConfig:read',
  'userConfig:save',
  'userConfig:reset',
  'app:quit',
  'window:setNormalSize',
  'window:setOnboardingSize',
  'window:getSize',
] as const

const allowedInvokeChannels = new Set<typeof invokeChannels[number]>(invokeChannels)

const onChannels = ['install:progress', 'install:log'] as const
const allowedOnChannels = new Set<typeof onChannels[number]>(onChannels)

// Store listener wrappers so we can properly remove them.
const listenerMap = new Map<string, (event: IpcRendererEvent, ...args: unknown[]) => void>()
let listenerId = 0

const safeInvoke = <T = unknown>(channel: string, ...args: unknown[]): Promise<T> => {
  if (!allowedInvokeChannels.has(channel as never)) {
    return Promise.reject(new Error('IPC channel not allowed'))
  }
  return ipcRenderer.invoke(channel, ...args)
}

const safeOn = <T = unknown>(channel: string, listener: (event: unknown, data: T) => void): string => {
  if (!allowedOnChannels.has(channel as never)) {
    throw new Error('IPC channel not allowed')
  }
  const id = `${channel}:${++listenerId}`
  const wrapper = (event: IpcRendererEvent, ...args: unknown[]) => listener(event, args[0] as T)
  listenerMap.set(id, wrapper)
  ipcRenderer.on(channel, wrapper)
  return id
}

const safeOff = (channel: string, id: string) => {
  const wrapper = listenerMap.get(id)
  if (wrapper) {
    ipcRenderer.off(channel, wrapper)
    listenerMap.delete(id)
  }
}

// Expose a minimal, whitelisted IPC surface to the renderer.
contextBridge.exposeInMainWorld('pakky', {
  invoke: safeInvoke,
  on: safeOn,
  off: safeOff,
})
