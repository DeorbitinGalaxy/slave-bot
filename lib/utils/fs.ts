import { statSync, unlinkSync, mkdirSync } from 'fs';

export function mkdir (path: string) {
  
    try {
      const stat = statSync(path);
      if (stat && !stat.isDirectory) {
        unlinkSync(path);
      }
    }
    catch (ignored) {
      mkdirSync(path);
    }
  }