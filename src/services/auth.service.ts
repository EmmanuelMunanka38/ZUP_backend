import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import config from '../config';
import prisma from '../db/prisma';
import { JwtPayload } from '../middleware/auth';
import { sendOtpEmail } from './email.service';
import { createError } from '../middleware/errorHandler';

export const generateOtp = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export const hashOtp = async (otp: string): Promise<string> => {
  return bcrypt.hash(otp, 10);
};

const detectRole = (phone: string): { role: 'customer' | 'driver' | 'restaurant_owner'; cleanPhone: string } => {
  if (phone.startsWith('D+255') || phone.startsWith('D07') || phone.startsWith('D06')) {
    return { role: 'driver', cleanPhone: phone.slice(1) };
  }
  if (phone.startsWith('R')) {
    return { role: 'restaurant_owner', cleanPhone: phone.slice(1) };
  }
  return { role: 'customer', cleanPhone: phone };
};

export const createOtpRecord = async (email: string, phone: string): Promise<string> => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = phone.replace(/[\s-]/g, '');

  const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (existingUser) {
    throw createError('Email already in use', 409);
  }

  const otp = generateOtp();
  const hashedOtp = await hashOtp(otp);
  const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

  const cleanEmail = email.trim().toLowerCase();
  const rawPhone = phone.replace(/[\s-]/g, '');
  const { role, cleanPhone } = detectRole(rawPhone);

  try {
    await prisma.user.upsert({
      where: { email: cleanEmail },
      update: { otpCode: hashedOtp, otpExpiresAt },
      create: { email: cleanEmail, phone: cleanPhone, name: '', role, otpCode: hashedOtp, otpExpiresAt },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = (error.meta?.target as string[])?.join(', ');
      if (target?.includes('phone')) {
        const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
        if (existing) {
          await prisma.user.update({
            where: { id: existing.id },
            data: { otpCode: hashedOtp, otpExpiresAt },
          });
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  }
  await prisma.user.upsert({
    where: { email: cleanEmail },
    update: { otpCode: hashedOtp, otpExpiresAt, phone: cleanPhone },
    create: { email: cleanEmail, phone: cleanPhone, name: '', otpCode: hashedOtp, otpExpiresAt },
  });

  sendOtpEmail(cleanEmail, otp).catch((err: any) => {
    console.error(`[EMAIL] Failed to send OTP to ${cleanEmail}:`, err);
  });
  if (config.isDev) console.log(`[DEV] OTP for ${cleanEmail}: ${otp}`);

  return otp;
};

export const verifyOtpCode = async (
  email: string,
  code: string,
  name?: string,
  rememberMe?: boolean,
): Promise<{ user: any; accessToken: string; refreshToken: string } | null> => {
  const cleanEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
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

  const tokens = await generateTokens(user.id, user.role, rememberMe);

  return {
    user: sanitizeUser(updatedUser),
    ...tokens,
  };
};

export const generateTokens = async (
  userId: string,
  role: string,
  rememberMe?: boolean,
): Promise<{ accessToken: string; refreshToken: string }> => {
  const accessToken = jwt.sign({ userId, role } as JwtPayload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn as any,
  });

  const refreshPayload: JwtPayload = { userId, role };
  if (rememberMe) refreshPayload.rememberMe = true;

  const refreshExpiry = rememberMe ? config.jwt.rememberExpiresIn : config.jwt.refreshExpiresIn;

  const refreshToken = jwt.sign(refreshPayload, config.jwt.refreshSecret, {
    expiresIn: refreshExpiry as any,
  });

  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: await bcrypt.hash(refreshToken, 5) },
  });

  return { accessToken, refreshToken };
};

export const refreshAccessToken = async (
  token: string,
): Promise<{ accessToken: string; refreshToken: string } | null> => {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user || !user.refreshToken) return null;

    const isValid = await bcrypt.compare(token, user.refreshToken);
    if (!isValid) return null;

    return generateTokens(user.id, user.role, decoded.rememberMe);
  } catch {
    return null;
  }
};

export const sanitizeUser = (user: any) => {
  const { otpCode, otpExpiresAt, refreshToken, ...sanitized } = user;
  return sanitized;
};
