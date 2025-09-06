import { Router } from 'express';

import * as AuthController from '@/controllers/auth.controller.js';
import { authMiddleware } from '@/middlewares/authMiddleware.js';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/verify-token', authMiddleware, AuthController.verifyToken);
router.get('/me', authMiddleware, AuthController.me);

export default router;
