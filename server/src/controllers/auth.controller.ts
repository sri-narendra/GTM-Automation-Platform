import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User';
import { config } from '../config';
import { AuthRequest } from '../middleware/auth';
import { AuthError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').max(100),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  plan: z.enum(['free', 'pro', 'enterprise']).optional(),
});

function generateToken(userId: string): string {
  return jwt.sign({ userId }, config.jwt.secret, { expiresIn: config.jwt.expiresIn } as jwt.SignOptions);
}

export async function register(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password, name } = registerSchema.parse(req.body);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ValidationError('A user with this email already exists');
    }

    const user = await User.create({ email, password, name });

    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      data: {
        token,
        user: user.toJSON(),
      },
      message: 'Account created successfully',
    } satisfies ApiResponse);

    logger.info({ userId: user._id }, 'User registered successfully');
  } catch (err) {
    next(err);
  }
}

export async function login(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new AuthError('Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AuthError('Invalid email or password');
    }

    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      data: {
        token,
        user: user.toJSON(),
      },
      message: 'Logged in successfully',
    } satisfies ApiResponse);

    logger.info({ userId: user._id }, 'User logged in');
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.user!._id);
    if (!user) {
      throw new AuthError('User not found');
    }

    res.json({
      success: true,
      data: user,
    } satisfies ApiResponse);
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const updates = updateProfileSchema.parse(req.body);

    const user = await User.findByIdAndUpdate(req.user!._id, { $set: updates }, { new: true, runValidators: true });
    if (!user) {
      throw new AuthError('User not found');
    }

    res.json({
      success: true,
      data: user,
      message: 'Profile updated successfully',
    } satisfies ApiResponse);
  } catch (err) {
    next(err);
  }
}
