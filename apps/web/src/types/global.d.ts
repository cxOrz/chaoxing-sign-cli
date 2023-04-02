declare module '*.module.css';

declare module '@nuintun/qrcode';

interface UserParamsType {
  phone: string;
  password: string;
  name: string;
  fid: string;
  lv: string;
  uf: string;
  vc3: string;
  _d: string;
  _uid: string;
  date: Date;
  monitor: boolean;
  config: UserConfig;
}

interface UserConfig {
  monitor: MonitorConfig;
  mailing: MailingConfig;
  cqserver: CQServerConfig;
}

interface MonitorConfig {
  delay: number;
  lon: string;
  lat: string;
  address: string;
}
interface MailingConfig {
  enabled: boolean;
  host: string;
  ssl: boolean;
  port: number;
  user: string;
  pass: string;
  to: string;
}
interface CQServerConfig {
  cq_enabled: boolean;
  ws_url: string;
  target_type: string;
  target_id: number;
}