import { join } from "path";
import { homedir } from "os";

export interface SlaveBotConfig {
  botToken: string;
  initialPlayingGame?: string;
  adminRole?: string;
  botUsername?: string;
  plugins?: { name: string, path?: string, className?: string, options?: any }[];
}

export const PLUGIN_DIR: string = '../plugins';
export const APP_DATA_DIR: string = join(homedir(), '.slavebot');
export const DATABASES_DIR: string = join(APP_DATA_DIR, 'databases');

