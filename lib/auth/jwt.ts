import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

// Generate JWT token
export const generateToken = (payload: { userId: string; email: string; role: string }): string => {
  const secret = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  
  return jwt.sign(payload, secret, { 
    expiresIn: process.env.JWT_EXPIRES_IN || '24h' 
  });
};

// Verify JWT token
export const verifyToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  
  return jwt.verify(token, secret) as JwtPayload;
};

// JWT Authentication Middleware
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  console.log('authenticateJWT called for:', req.method, req.path);
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      console.log('No token provided for:', req.method, req.path);
      return res.status(401).json({ error: 'Access token is required' });
    }

    try {
      const decoded = verifyToken(token);
      // Add user info to request object
      (req as any).user = decoded;
      console.log('Token verified successfully for:', req.method, req.path);
      next();
    } catch (error) {
      console.log('Invalid token for:', req.method, req.path);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};