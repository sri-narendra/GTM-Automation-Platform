import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as any;
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      next();
    } catch (err: any) {
      if (err instanceof ZodError) {
        const formatted: Record<string, string[]> = {};
        for (const issue of err.issues) {
          const path = issue.path.join('.');
          if (!formatted[path]) formatted[path] = [];
          formatted[path].push(issue.message);
        }
        next(new ValidationError('Validation failed', formatted));
      } else {
        next(err);
      }
    }
  };
}
