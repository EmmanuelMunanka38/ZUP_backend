import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../config';
import prisma from '../db/prisma';
import { JwtPayload } from '../middleware/auth';
import { sendOtpEmail } from './email.service';
import { sendOtpSms } from './sms.service';

const isEmail = (contact: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
const sanitizePhone = (contact: string): string => contact.replace(/[\s-]/g, '');

export const generateOtp = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export const hashOtp = async (otp: string): Promise<string> => {
  return bcrypt.hash(otp, 10);
};

export const createOtpRecord = async (contact: string, method: 'sms' | 'email'): Promise<string> => {
  const otp = generateOtp();
  const hashedOtp = await hashOtp(otp);
  const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

  if (method === 'email' || isEmail(contact)) {
    const email = contact.trim().toLowerCase();
    await prisma.user.upsert({
      where: { email },
      update: { otpCode: hashedOtp, otpExpiresAt, email },
      create: { email, name: '', otpCode: hashedOtp, otpExpiresAt },
    });
    await sendOtpEmail(email, otp);
    if (config.isDev) console.log(`[DEV] OTP for ${email}: ${otp}`);
  } else {
    const phone = sanitizePhone(contact);
    await prisma.user.upsert({
      where: { phone },
      update: { otpCode: hashedOtp, otpExpiresAt },
      create: { phone, otpCode: hashedOtp, otpExpiresAt },
    });
    await sendOtpSms(phone, otp);
    if (config.isDev) console.log(`[DEV] OTP for ${phone}: ${otp}`);
  }

  return otp;
};



const findUserByContact = async (contact: string) => {
  if (isEmail(contact)) {
    return prisma.user.findUnique({ where: { email: contact } });
  }
  return prisma.user.findUnique({ where: { phone: contact } });
};

export const verifyOtpCode = async (
  contact: string,
  code: string,
  name?: string,
): Promise<{ user: any; accessToken: string; refreshToken: string } | null> => {
  const user = await findUserByContact(contact);
  if (!user || !user.otpCode || !user.otpExpiresAt) return null;

  if (new Date() > user.otpExpiresAt) return null;

  const isValid = await bcrypt.compare(code, user.otpCode);
  if (!isValid) return null;

  const updateData: any = { otpCode: null, otpExpiresAt: null };
  if (name) updateData.name = name;

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: updateData,
  });

  const tokens = await generateTokens(user.id, user.role);

  return {
    user: sanitizeUser(updatedUser),
    ...tokens,
  };
};

export const generateTokens = async (userId: string, role: string): Promise<{ accessToken: string; refreshToken: string }> => {
  const accessToken = jwt.sign(
    { userId, role } as JwtPayload,
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiresIn as any }
  );

  const refreshToken = jwt.sign(
    { userId, role } as JwtPayload,
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn as any }
  );

  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: await bcrypt.hash(refreshToken, 5) },
  });

  return { accessToken, refreshToken };
};

export const refreshAccessToken = async (token: string): Promise<{ accessToken: string; refreshToken: string } | null> => {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user || !user.refreshToken) return null;

    const isValid = await bcrypt.compare(token, user.refreshToken);
    if (!isValid) return null;

    return generateTokens(user.id, user.role);
  } catch {
    return null;
  }
};

export const sanitizeUser = (user: any) => {
  const { otpCode, otpExpiresAt, refreshToken, ...sanitized } = user;
  return sanitized;
};
