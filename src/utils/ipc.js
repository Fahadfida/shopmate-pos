// src/utils/ipc.js

/**
 * Centralized Electron IPC accessor.
 * Returns the ipcRenderer if running inside Electron, otherwise null.
 */
// export const getIpc = () => {
//   return window.require ? window.require("electron").ipcRenderer : null;
// };

// src/utils/ipc.js

// export const getIpc = () => {
//   // Check if we are in Electron and the bridge exists
//   if (window.electronAPI) {
//     return {
//       invoke: (channel, ...args) => window.electronAPI.invoke(channel, ...args),
//     };
//   }

//   // Fallback for standard web browser (dev mode if opened in Chrome)
//   return null;
// };

export const getIpc = () => {
  // Return the safe bridge provided by preload.js
  if (window.electronAPI) {
    return window.electronAPI;
  }
  return null;
};
