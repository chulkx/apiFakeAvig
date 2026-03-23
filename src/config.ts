export interface Config {
  targetUrl: string;
  avigilonToken: string;
  port: number;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const config: Config = {
  targetUrl: requireEnv('TARGET_URL'),
  avigilonToken: requireEnv('AVIGILON_TOKEN'),
  port: parseInt(process.env['PORT'] ?? '4000', 10),
};
