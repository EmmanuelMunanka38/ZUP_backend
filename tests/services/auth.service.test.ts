import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import * as authService from '@/services/auth.service';

vi.mock('@/db/prisma', () => {
  return {
    default: {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    },
  };
});

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateOtp', () => {
    it('should generate a 4-digit OTP', () => {
      const otp = authService.generateOtp();
      expect(otp).toMatch(/^\d{4}$/);
    });

    it('should generate different OTPs each time', () => {
      const otp1 = authService.generateOtp();
      const otp2 = authService.generateOtp();
      expect(otp1).not.toBe(otp2);
    });
  });

  describe('hashOtp', () => {
    it('should hash an OTP', async () => {
      const otp = '1234';
      const hash = await authService.hashOtp(otp);
      expect(hash).toBeDefined();
      expect(hash).not.toBe(otp);
    });

    it('should produce different hashes for same OTP', async () => {
      const otp = '1234';
      const hash1 = await authService.hashOtp(otp);
      const hash2 = await authService.hashOtp(otp);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', async () => {
      const prisma = (await import('@/db/prisma')).default;
      (prisma.user.update as any).mockResolvedValue({});

      const tokens = await authService.generateTokens('test-user-id', 'customer');
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();

      const decoded = jwt.decode(tokens.accessToken) as any;
      expect(decoded.userId).toBe('test-user-id');
      expect(decoded.role).toBe('customer');
    });

    it('should generate different token pairs for different calls', async () => {
      const prisma = (await import('@/db/prisma')).default;
      (prisma.user.update as any).mockResolvedValue({});

      const tokens1 = await authService.generateTokens('user-1', 'customer');
      const tokens2 = await authService.generateTokens('user-2', 'restaurant_owner');
      expect(tokens1.accessToken).not.toBe(tokens2.accessToken);
      expect(tokens1.refreshToken).not.toBe(tokens2.refreshToken);
    });
  });

  describe('sanitizeUser', () => {
    it('should remove sensitive fields from user object', () => {
      const user = {
        id: '123',
        phone: '+255712345678',
        otpCode: 'hashed-otp',
        otpExpiresAt: new Date(),
        refreshToken: 'some-token',
        name: 'Test User',
        role: 'customer',
      };

      const sanitized = authService.sanitizeUser(user);

      expect(sanitized).not.toHaveProperty('otpCode');
      expect(sanitized).not.toHaveProperty('otpExpiresAt');
      expect(sanitized).not.toHaveProperty('refreshToken');
      expect(sanitized).toHaveProperty('id', '123');
      expect(sanitized).toHaveProperty('phone', '+255712345678');
      expect(sanitized).toHaveProperty('name', 'Test User');
    });
  });
});
