interface Window {
  electronAPI: {
    saveFile: (buffer: ArrayBuffer, filename: string) => Promise<{ ok: boolean }>
  }
}
