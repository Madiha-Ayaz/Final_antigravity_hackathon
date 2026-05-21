import { Router, Request, Response } from 'express';
import { createLogger } from '@silentsiren/logger';
import { userRepository } from '../repositories/user.repository';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { config } from '@silentsiren/config';

const router = Router();
const logger = createLogger('auth-routes');

const registerSchema = z.object({
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 characters'),
  email: z.string().email().optional(),
  fullName: z.string().optional(),
  deviceFingerprint: z.string().optional(),
});

const loginSchema = z.object({
  phoneNumber: z.string().min(10, 'Phone number is required'),
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const validation = registerSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: validation.error.errors,
        },
      });
    }

    const { phoneNumber, email, fullName, deviceFingerprint } = validation.data;

    logger.info({ phoneNumber }, 'User registration attempt');

    // Check if user already exists
    const existingUser = await userRepository.findByPhoneNumber(phoneNumber);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this phone number already exists',
        },
      });
    }

    // Create new user
    const user = await userRepository.create({
      phone_number: phoneNumber,
      email,
      full_name: fullName,
      device_fingerprint: deviceFingerprint,
    });

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, phoneNumber: user.phone_number }, config.JWT_SECRET, {
      expiresIn: '7d',
    });

    logger.info({ userId: user.id }, 'User registered successfully');

    res.status(201).json({
      success: true,
      data: {
        userId: user.id,
        phoneNumber: user.phone_number,
        email: user.email,
        fullName: user.full_name,
        token,
        message: 'Registration successful',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Registration failed');
    res.status(500).json({
      success: false,
      error: {
        code: 'REGISTRATION_FAILED',
        message: 'Failed to register user',
      },
    });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: validation.error.errors,
        },
      });
    }

    const { phoneNumber } = validation.data;

    logger.info({ phoneNumber }, 'User login attempt');

    // Find user
    const user = await userRepository.findByPhoneNumber(phoneNumber);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    // Update last login
    await userRepository.updateLastLogin(user.id);

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, phoneNumber: user.phone_number }, config.JWT_SECRET, {
      expiresIn: '7d',
    });

    logger.info({ userId: user.id }, 'User logged in successfully');

    res.json({
      success: true,
      data: {
        token,
        userId: user.id,
        phoneNumber: user.phone_number,
        email: user.email,
        fullName: user.full_name,
        isVerified: user.is_verified,
        reputationScore: user.reputation_score,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Login failed');
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGIN_FAILED',
        message: 'Failed to login',
      },
    });
  }
});

export default router;
