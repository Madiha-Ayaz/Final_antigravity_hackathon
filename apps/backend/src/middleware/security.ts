import { Request, Response, NextFunction } from 'express';

export const securityMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  const contentType = req.get('content-type');
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    if (!contentType || !contentType.includes('application/json')) {
      if (!req.url.includes('/upload')) {
        res.status(415).json({
          success: false,
          error: {
            code: 'UNSUPPORTED_MEDIA_TYPE',
            message: 'Content-Type must be application/json',
          },
        });
        return;
      }
    }
  }

  next();
};
