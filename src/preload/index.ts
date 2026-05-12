import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (buffer: ArrayBuffer, filename: string) =>
    ipcRenderer.invoke('save-file', new Uint8Array(buffer), filename),
})
