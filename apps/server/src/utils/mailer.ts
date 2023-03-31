import nodemailer from 'nodemailer';
import { request } from './request';

export function sendEmail(args: { aid: string; uid: string; realname: string; status: string | null; mailing: MailConfig; }) {
  const { uid, realname, aid, status, mailing } = args;
  const transporter = nodemailer.createTransport({
    host: mailing.host,
    port: mailing.port,
    secure: mailing.ssl,
    auth: {
      user: mailing.user,
      pass: mailing.pass,
    },
  });
  transporter.sendMail(
    {
      from: `"CLI" <${mailing.user}>`,
      to: mailing.to,
      subject: '服务器签到反馈',
      html: `<table border="1"><thead><th>aid</th><th>uid</th><th>name</th><th>status</th></thead><tbody><td>${aid}</td><td>${uid}</td><td>${realname}</td><td>${status}</td></tbody></table>`,
    },
    () => {
      transporter.close();
    }
  );
}

interface PushPlusType {
  token: string;
  title?: string;
  content: string;
  template?: 'html' | 'txt' | 'json' | 'markdown';
  channel?: 'wechat' | 'webhook' | 'mail' | 'sms';
}

export const pushplusSend = (args: PushPlusType) => {
  return request(
    'http://www.pushplus.plus/send',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    },
    args
  );
};
