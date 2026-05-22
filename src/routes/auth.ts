import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../db/prisma';
import auth, { AuthRequest } from '../middleware/auth';
import validate from '../middleware/validate';
import { otpLimiter, authLimiter } from '../middleware/rateLimiter';
import * as authService from '../services/auth.service';

const router = Router();

const isEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

const contactField = z.string().min(1, 'Contact is required').refine(
  (val) => isEmail(val) || /^\+?\d{7,15}$/.test(val.replace(/[\s-]/g, '')),
  { message: 'Must be a valid email or phone number' },
);

const sendOtpSchema = z.object({
  contact: contactField,
  method: z.enum(['sms', 'email']),
});

const verifyOtpSchema = z.object({
  contact: z.string().min(1, 'Contact is required'),
  code: z.string().length(4, 'Code must be 4 digits'),
  name: z.string().min(1).max(100).optional(),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  avatar: z.string().optional(),
  fcmToken: z.string().optional(),
});

router.post('/send-otp', otpLimiter, validate(sendOtpSchema), async (req, res: Response): Promise<void> => {
  try {
    const { contact, method } = req.body;
    const otp = await authService.createOtpRecord(contact, method);
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), async (req, res: Response): Promise<void> => {
  try {
    const { contact, code, name } = req.body;
    const result = await authService.verifyOtpCode(contact, code, name);

    if (!result) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please request a new one.',
      });
      return;
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
});

router.post('/refresh', validate(refreshSchema), async (req, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshAccessToken(refreshToken);

    if (!tokens) {
      res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
      return;
    }

    res.json({ success: true, data: tokens });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ success: false, message: 'Failed to refresh token' });
  }
});

router.get('/profile', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, phone: true, name: true, avatar: true, email: true, role: true, fcmToken: true, createdAt: true },
    });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to get profile' });
  }
});

router.put('/profile', auth, validate(updateProfileSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data: any = {};
    if (req.body.name !== undefined) data.name = req.body.name;
    if (req.body.email !== undefined) data.email = req.body.email;
    if (req.body.avatar !== undefined) data.avatar = req.body.avatar;
    if (req.body.fcmToken !== undefined) data.fcmToken = req.body.fcmToken;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
      select: { id: true, phone: true, name: true, avatar: true, email: true, role: true, fcmToken: true, createdAt: true },
    });

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

router.post('/logout', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.user.update({
      where: { id: req.userId },
      data: { refreshToken: null },
    });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Failed to logout' });
  }
});

export default router;
