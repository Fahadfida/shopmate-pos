// src/utils/ipc.js

/**
 * Centralized Electron IPC accessor.
 * Returns the ipcRenderer if running inside Electron, otherwise null.
 */
export const getIpc = () => {
  return window.require ? window.require("electron").ipcRenderer : null;
};