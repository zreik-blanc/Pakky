"use strict";
const electron = require("electron");
const invokeChannels = [
  "system:getPlatform",
  "system:getInfo",
  "system:checkHomebrew",
  "config:load",
  "config:save",
  "config:selectFile",
  "config:saveDialog",
  "install:start",
  "install:cancel",
  "install:getInstalled",
  "install:homebrew",
  "search:brew",
  "search:info",
  "userInput:getValues",
  "userInput:saveValues",
  "userInput:getValue",
  // 'shell:run' - REMOVED for security
  "shell:openExternal",
  "presets:list"
];
const allowedInvokeChannels = new Set(invokeChannels);
const onChannels = ["install:progress", "install:log"];
const allowedOnChannels = new Set(onChannels);
const listenerMap = /* @__PURE__ */ new Map();
let listenerId = 0;
const safeInvoke = (channel, ...args) => {
  if (!allowedInvokeChannels.has(channel)) {
    return Promise.reject(new Error("IPC channel not allowed"));
  }
  return electron.ipcRenderer.invoke(channel, ...args);
};
const safeOn = (channel, listener) => {
  if (!allowedOnChannels.has(channel)) {
    throw new Error("IPC channel not allowed");
  }
  const id = `${channel}:${++listenerId}`;
  const wrapper = (event, ...args) => listener(event, args[0]);
  listenerMap.set(id, wrapper);
  electron.ipcRenderer.on(channel, wrapper);
  return id;
};
const safeOff = (channel, id) => {
  const wrapper = listenerMap.get(id);
  if (wrapper) {
    electron.ipcRenderer.off(channel, wrapper);
    listenerMap.delete(id);
  }
};
electron.contextBridge.exposeInMainWorld("pakky", {
  invoke: safeInvoke,
  on: safeOn,
  off: safeOff
});
