export const logger = {
  info: (message: string) => {
    console.log('[INFO] [CLI]:', message);
  },
  
  success: (message: string) => {
    console.log('[SUCCESS] [CLI]:', message);
  },
  
  warn: (message: string) => {
    console.log('[WARN] [CLI]:', message);
  },
  
  error: (message: string) => {
    console.log('[ERROR] [CLI]:', message);
  },
  
  log: (message: string) => {
    console.log('[LOG] [CLI]:', message);
  }
}; 