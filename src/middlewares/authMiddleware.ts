import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { isUserPayload } from '@/types/user.types.js';

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ error: 'Acesso negado. Nenhum token JWT fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token malformado.' });

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error('Chave secreta JWT não foi definida no .env');
    return res
      .status(500)
      .json({ error: 'Erro de configuração interna do servidor.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

    if (isUserPayload(decoded)) {
      req.user = decoded;
      next();
    } else {
      throw new Error('Payload do token inválido');
    }
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido.' });
  }
};
