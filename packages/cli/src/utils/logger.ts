export const logger = {
  info: (message: string,...args: any[]) => {
    console.log('[INFO] [CLI]:', message,...args);
  },
  
  success: (message: string,...args: any[]) => {
    console.log('[SUCCESS] [CLI]:', message,...args);
  },
  
  warn: (message: string,...args: any[]) => {
    console.log('[WARN] [CLI]:', message,...args);
  },
  
  error: (message: string,...args: any[]) => {
    console.log('[ERROR] [CLI]:', message,...args);
  },
  
  log: (message: string,...args: any[]) => {
    console.log('[LOG] [CLI]:', message,...args);
  }
}; 