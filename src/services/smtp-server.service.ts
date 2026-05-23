import { SMTPServer, SMTPServerSession } from 'smtp-server';
import nodemailer from 'nodemailer';
import dns from 'dns/promises';
import config from '../config';

let server: SMTPServer | null = null;

async function deliverEmail(rawEmail: string, session: SMTPServerSession): Promise<void> {
  const mailFromAddr = session.envelope.mailFrom;
  const mailFrom = (typeof mailFromAddr === 'object' ? mailFromAddr.address : undefined) || config.email.from;
  const recipients = session.envelope.rcptTo.map((r) => r.address);

  const hasRelay = !!(config.email.relay.host && config.email.relay.user && config.email.relay.pass);

  if (hasRelay) {
    console.log(`[SelfHostedSMTP] Relaying via ${config.email.relay.host}:${config.email.relay.port}`);
    const relayTransporter = nodemailer.createTransport({
      host: config.email.relay.host,
      port: config.email.relay.port,
      secure: false,
      requireTLS: true,
      auth: {
        user: config.email.relay.user,
        pass: config.email.relay.pass,
      },
      tls: { rejectUnauthorized: false },
    });

    await relayTransporter.sendMail({
      raw: rawEmail,
      envelope: {
        from: mailFrom,
        to: recipients,
      },
    });

    console.log(`[SelfHostedSMTP] Delivered to ${recipients.join(', ')} via relay`);
    relayTransporter.close();
    return;
  }

  const errors: Error[] = [];
  const domainGroups = new Map<string, string[]>();
  for (const recipient of recipients) {
    const domain = recipient.split('@')[1]?.toLowerCase();
    if (!domain) continue;
    const list = domainGroups.get(domain) || [];
    list.push(recipient);
    domainGroups.set(domain, list);
  }

  for (const [domain, domainRecipients] of domainGroups) {
    try {
      const mxRecords = await dns.resolveMx(domain);
      mxRecords.sort((a, b) => a.priority - b.priority);

      if (mxRecords.length === 0) {
        errors.push(new Error(`No MX records for ${domain}`));
        continue;
      }

      let delivered = false;
      for (const mx of mxRecords) {
        try {
          const transporter = nodemailer.createTransport({
            host: mx.exchange,
            port: 25,
            secure: false,
            requireTLS: true,
            tls: { rejectUnauthorized: false },
          });

          await transporter.sendMail({
            raw: rawEmail,
            envelope: {
              from: mailFrom,
              to: domainRecipients,
            },
          });

          console.log(
            `[SelfHostedSMTP] Delivered to ${domainRecipients.join(', ')} via ${mx.exchange} (priority ${mx.priority})`,
          );
          transporter.close();
          delivered = true;
          break;
        } catch (err) {
          console.warn(
            `[SelfHostedSMTP] MX ${mx.exchange} failed for ${domain}:`,
            err instanceof Error ? err.message : err,
          );
        }
      }

      if (!delivered) {
        errors.push(new Error(`All MX servers rejected delivery for ${domain}`));
      }
    } catch (err) {
      errors.push(err instanceof Error ? err : new Error(String(err)));
    }
  }

  if (errors.length > 0) {
    throw new Error(`Delivery failed: ${errors.map((e) => e.message).join('; ')}`);
  }
}

export const startSmtpServer = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    server = new SMTPServer({
      name: config.email.selfHostedDomain,
      authOptional: true,
      disabledCommands: ['STARTTLS'],
      onData(stream, session, callback) {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('end', async () => {
          const rawEmail = Buffer.concat(chunks);
          try {
            await deliverEmail(rawEmail.toString(), session);
            callback();
          } catch (err) {
            console.error('[SelfHostedSMTP] Delivery error:', err);
            callback(err as Error);
          }
        });
        stream.on('error', callback);
      },
    });

    server.on('error', (err) => {
      console.error('[SelfHostedSMTP] Server error:', err);
      reject(err);
    });

    server.listen(config.email.selfHostedPort, () => {
      console.log(`[SelfHostedSMTP] Listening on port ${config.email.selfHostedPort}`);
      resolve();
    });
  });
};

export const stopSmtpServer = async (): Promise<void> => {
  if (!server) return;
  return new Promise<void>((resolve) => {
    server!.close(() => {
      console.log('[SelfHostedSMTP] Server stopped');
      server = null;
      resolve();
    });
  });
};
