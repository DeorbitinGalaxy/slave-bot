export interface SlaveBotConfig {
  botToken: string;
  initialPlayingGame?: string;
  adminRole?: string;
  botUsername?: string;
  plugins?: { name: string, path?: string, options?: any }[];
}