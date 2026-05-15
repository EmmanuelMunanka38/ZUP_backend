import nodemailer from 'nodemailer';
import config from '@/config';

let transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  if (config.email.user && config.email.pass) {
    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`[EMAIL] Ethereal test account created: ${testAccount.user}`);
    console.log(`[EMAIL] Preview URL: https://ethereal.email/login`);
  }

  return transporter;
}

export const sendOtpEmail = async (to: string, otp: string): Promise<void> => {
  const t = await getTransporter();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background-color: #fcf9f8; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 64px; height: 64px; background-color: #006d36; border-radius: 16px; line-height: 64px; font-size: 32px; margin-bottom: 8px;">🛵</div>
        <h1 style="color: #006d36; font-size: 24px; margin: 0;">Piki Food</h1>
      </div>
      <h2 style="color: #1c1b1b; font-size: 20px; text-align: center;">Your Verification Code</h2>
      <p style="color: #3d4a3e; text-align: center; font-size: 14px; line-height: 1.6;">
        Use the code below to complete your verification. This code expires in 5 minutes.
      </p>
      <div style="background-color: #ffffff; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; border: 1px solid #e5e2e1;">
        <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #006d36;">${otp}</span>
      </div>
      <p style="color: #6b766c; text-align: center; font-size: 12px;">
        If you didn't request this code, you can safely ignore this email.
      </p>
      <hr style="border: none; border-top: 1px solid #e5e2e1; margin: 24px 0;" />
      <p style="color: #6b766c; text-align: center; font-size: 12px;">
        &copy; ${new Date().getFullYear()} Piki Food. All rights reserved.
      </p>
    </div>
  `;

  const info = await t.sendMail({
    from: `"Piki Food" <${config.email.from}>`,
    to,
    subject: 'Your Piki Food verification code',
    html,
  });

  console.log(`[EMAIL] OTP sent to ${to} (messageId: ${info.messageId})`);
  if (info.messageId) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[EMAIL] Preview URL: ${previewUrl}`);
    }
  }
};
