import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { userService } from '../server/services.js';
import { generateToken, verifyToken } from '../lib/auth/jwt.js';

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@gmail.com
 *               password:
 *                 type: string
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user with password for authentication
    const user = await userService.getByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify the provided password against the stored hashed password
    if (!user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Compare the provided password with the hashed password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Generate refresh token
    const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET || 'fallback-refresh-secret-change-in-production';
    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      refreshTokenSecret,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
    );

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *               password:
 *                 type: string
 *                 example: securepassword123
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request
 *       409:
 *         description: User already exists
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if user already exists
    try {
      const existingUser = await userService.getByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'User with this email already exists' });
      }
    } catch (error) {
      // User doesn't exist, continue with registration
    }

    // Get the first company to assign the user to (as a default)
    const companies = await import('../server/services.js').then(m => m.companyService.getAll());
    if ((await companies).length === 0) {
      return res.status(400).json({ error: 'Cannot register a new user: No companies exist in the system.' });
    }

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create the new user with hashed password
    const newUser = await userService.create({
      name,
      email,
      password: hashedPassword, // Store the hashed password
      role: 'User', // Default role for new users
      companyId: (await companies)[0].id // Assign to first company
    });

    // Generate tokens for the newly registered user
    const accessToken = generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role
    });

    const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET || 'fallback-refresh-secret-change-in-production';
    const refreshToken = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      refreshTokenSecret,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      accessToken,
      refreshToken,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    const user: any = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get full user info from database
    const fullUser = await userService.getById(user.userId);
    if (!fullUser) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      id: fullUser.id,
      name: fullUser.name,
      email: fullUser.email,
      role: fullUser.role
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to retrieve user profile' });
  }
});

export default router;