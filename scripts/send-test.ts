import { startSmtpServer, stopSmtpServer } from '../src/services/smtp-server.service';
import { sendOtpEmail } from '../src/services/email.service';

async function main() {
  const to = 'emmanuelmunanka38@gmail.com';
  const otp = String(Math.floor(1000 + Math.random() * 9000));

  console.log(`[Test] Starting self-hosted SMTP server...`);
  await startSmtpServer();

  console.log(`[Test] Sending OTP email to ${to}...`);
  await sendOtpEmail(to, otp);

  console.log(`[Test] Email sent! OTP was: ${otp}`);

  await stopSmtpServer();
}

main().catch((err) => {
  console.error('[Test] Failed:', err);
  process.exit(1);
});
