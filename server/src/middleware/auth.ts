import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User, IUserDocument } from '../models/User';
import { AuthError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: IUserDocument;
}

export async function authenticate(req: AuthRequest, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('No token provided. Please provide a Bearer token.');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AuthError('Token is missing from Authorization header.');
    }

    const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new AuthError('User associated with this token no longer exists.');
    }

    req.user = user;
    next();
  } catch (err: any) {
    if (err instanceof AuthError) {
      next(err);
    } else if (err.name === 'JsonWebTokenError') {
      next(new AuthError('Invalid token. Please provide a valid token.'));
    } else if (err.name === 'TokenExpiredError') {
      next(new AuthError('Token has expired. Please log in again.'));
    } else {
      logger.error({ err }, 'Authentication middleware error');
      next(new AuthError('Authentication failed'));
    }
  }
}

export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) return next();

    const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
    const user = await User.findById(decoded.userId);
    if (user) {
      req.user = user;
    }
  } catch {
    // silently ignore auth errors for optional auth
  }
  next();
}
