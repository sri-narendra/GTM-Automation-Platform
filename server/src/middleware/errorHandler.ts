import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';

interface MongooseValidationError extends Error {
  errors: Record<string, { message: string }>;
}

function isMongooseValidationError(err: any): err is MongooseValidationError {
  return err.name === 'ValidationError' && err.errors;
}

interface MongooseCastError extends Error {
  path: string;
  value: string;
}

function isMongooseCastError(err: any): err is MongooseCastError {
  return err.name === 'CastError';
}

interface MongooseDuplicateError extends Error {
  code: number;
  keyValue: Record<string, string>;
}

function isMongooseDuplicateError(err: any): err is MongooseDuplicateError {
  return err.code === 11000;
}

interface MulterError extends Error {
  code: string;
  field?: string;
}

function isMulterError(err: any): err is MulterError {
  return err.name === 'MulterError';
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  logger.error({ err, message: err.message, stack: err.stack }, 'Error caught by global handler');

  if (err instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      error: err.message,
    };
    if ('errors' in err && (err as any).errors) {
      (response as any).errors = (err as any).errors;
    }
    res.status(err.statusCode).json(response);
    return;
  }

  if (isMongooseValidationError(err)) {
    const errors: Record<string, string> = {};
    for (const [key, val] of Object.entries(err.errors)) {
      errors[key] = val.message;
    }
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors,
    } as ApiResponse);
    return;
  }

  if (isMongooseCastError(err)) {
    res.status(400).json({
      success: false,
      error: `Invalid ${err.path}: ${err.value}`,
    } satisfies ApiResponse);
    return;
  }

  if (isMongooseDuplicateError(err)) {
    const field = Object.keys(err.keyValue)[0];
    const value = Object.values(err.keyValue)[0];
    res.status(409).json({
      success: false,
      error: `Duplicate value for ${field}: "${value}". This ${field} is already in use.`,
    } satisfies ApiResponse);
    return;
  }

  if (isMulterError(err)) {
    let message = 'File upload error';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File too large. Maximum size is 5MB.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = `Unexpected field: ${err.field}`;
    }
    res.status(400).json({
      success: false,
      error: message,
    } satisfies ApiResponse);
    return;
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    } satisfies ApiResponse);
    return;
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
  } satisfies ApiResponse);
}
