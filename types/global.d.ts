declare namespace globalThis {
  interface JSON {
    parseJSON(text: string): any
  }
}

interface MonitorConfig {
  delay: number;
  lon: number;
  lat: number;
  address: string;
}

interface MailConfig {
  host: string;
  ssl: boolean;
  port: number;
  user: string;
  pass: string;
  to: string;
}

interface UserParams {
  _uid: string;
  _d: string;
  uf: string;
  vc3: string;
  fid: string;
  lv: string;
}

interface User {
  phone?: string;
  params?: UserParams;
  monitor?: MonitorConfig;
  mailing?: MailConfig;
}