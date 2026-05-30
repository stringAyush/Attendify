import nodemailer from 'nodemailer';
import { config } from '@/config/env';

const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: config.SMTP_PORT === 465,
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  if (!config.SMTP_HOST || !config.SMTP_USER) {
    console.warn('⚠️ SMTP not configured — skipping email send');
    return;
  }

  await transporter.sendMail({
    from: `"Attendify" <${config.SMTP_FROM}>`,
    ...options,
  });
}

export function getPasswordResetEmailHtml(
  name: string,
  resetUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 20px;">
      <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
        <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Attendify</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 15px;">Attendance Management Platform</p>
        </div>
        <div style="padding: 40px;">
          <h2 style="color: #1e293b; margin: 0 0 16px; font-size: 22px;">Reset Your Password</h2>
          <p style="color: #64748b; line-height: 1.6; margin: 0 0 24px;">Hi ${name}, we received a request to reset your password. Click the button below to create a new password.</p>
          <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px;">Reset Password</a>
          <p style="color: #94a3b8; font-size: 13px; margin: 24px 0 0; line-height: 1.5;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getLowAttendanceEmailHtml(
  teacherName: string,
  students: { name: string; rollNumber: string; percentage: number }[],
  className: string
): string {
  const studentRows = students
    .map(
      (s) =>
        `<tr>
          <td style="padding: 12px; border-bottom: 1px solid #f1f5f9;">${s.rollNumber}</td>
          <td style="padding: 12px; border-bottom: 1px solid #f1f5f9;">${s.name}</td>
          <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; color: #ef4444; font-weight: 600;">${s.percentage.toFixed(1)}%</td>
        </tr>`
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, sans-serif; background: #f8fafc; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
        <h2 style="color: #ef4444; margin: 0 0 8px;">⚠️ Low Attendance Alert</h2>
        <p style="color: #64748b;">Hi ${teacherName}, the following students in <strong>${className}</strong> have attendance below 75%:</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <thead>
            <tr style="background: #f8fafc;">
              <th style="padding: 12px; text-align: left; font-size: 13px; color: #64748b;">Roll No.</th>
              <th style="padding: 12px; text-align: left; font-size: 13px; color: #64748b;">Student Name</th>
              <th style="padding: 12px; text-align: left; font-size: 13px; color: #64748b;">Attendance %</th>
            </tr>
          </thead>
          <tbody>${studentRows}</tbody>
        </table>
      </div>
    </body>
    </html>
  `;
}
