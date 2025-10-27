import { Router } from 'express';
import userRoutes from './users.js';
import authRoutes from './auth.js';

const router = Router();

// Mount all routes under their respective paths
router.use('/users', userRoutes);
router.use('/auth', authRoutes);

// Add other route modules as they are created

export default router;