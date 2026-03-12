import nodemailer from "nodemailer";
import { config } from "./config.js";

let transporter = null;

const smtp = config.smtp;

export const isMailConfigured = () =>
  Boolean(smtp.host && smtp.port && smtp.user && smtp.pass && smtp.fromEmail);

const getTransporter = () => {
  if (!isMailConfigured()) return null;
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.pass
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000
  });

  return transporter;
};

export const sendMail = async ({ to, subject, text, html }) => {
  const tx = getTransporter();
  if (!tx) return null;

  return tx.sendMail({
    from: `${smtp.fromName} <${smtp.fromEmail}>`,
    to,
    subject,
    text,
    html
  });
};
