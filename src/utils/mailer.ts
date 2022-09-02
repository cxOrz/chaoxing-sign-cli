import nodemailer from 'nodemailer';
import { getJsonObject } from "./file";

const storage = getJsonObject('configs/storage.json');

export function sendEmail(aid: string, uid: string, realname: string, status: string) {
  let transporter = nodemailer.createTransport({
    host: storage.mailing.host,
    port: storage.mailing.port,
    secure: storage.mailing.ssl,
    auth: {
      user: storage.mailing.user,
      pass: storage.mailing.pass,
    },
  });
  transporter.sendMail({
    from: `"CLI" <${storage.mailing.user}>`,
    to: storage.mailing.to,
    subject: "服务器签到反馈",
    html: `<table border="1"><thead><th>aid</th><th>uid</th><th>name</th><th>status</th></thead><tbody><td>${aid}</td><td>${uid}</td><td>${realname}</td><td>${status}</td></tbody></table>`
  }, () => { transporter.close() });
}