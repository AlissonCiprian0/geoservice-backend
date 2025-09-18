import type { Request, Response } from 'express';
import type { RegisterUserDto } from '@/types/user.types.js';

import prisma from '@/lib/prisma.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

import { sendConfirmationEmail } from '@/services/sendEmailService.js';

export const register = async (req: Request, res: Response) => {
  const body: RegisterUserDto = req.body;

  const { email, password } = body;

  const existingUser = await prisma.user.findUnique({
    where: { email: email },
  });

  if (existingUser)
    return res.status(409).json({ error: 'Email já está em uso.' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const confirmationToken = randomBytes(32).toString('hex');

  // Atualiza o confirmationToken se o usuário já existir na base
  // Cria o usuário se ele ainda não existir na base
  await prisma.user.upsert({
    where: { email },
    update: { confirmationToken },
    create: { email, password: hashedPassword, confirmationToken },
  });

  await sendConfirmationEmail(email, confirmationToken);

  res.status(200).json({
    message: 'E-mail de confirmação enviado. Verifique sua caixa de entrada.',
  });
};

export const confirmEmail = async (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token || typeof token !== 'string')
    return res.status(400).json({ error: 'Token inválido.' });

  const user = await prisma.user.findUnique({
    where: { confirmationToken: token },
  });

  if (!user)
    return res
      .status(404)
      .json({ error: 'Token de confirmação não encontrado ou já utilizado.' });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      confirmationToken: null,
    },
  });

  res.status(200).json({ message: 'E-mail confirmado com sucesso!' });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid)
    return res.status(401).json({ error: 'Senha inválida.' });

  if (!user.emailVerified)
    return res.status(403).json({
      error: 'Por favor, confirme seu e-mail antes de fazer o login.',
    });

  // Gerar o token JWT
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, {
    expiresIn: '1d',
  });

  const { password: _, ...userWithoutPassword } = user;
  res.status(200).json({ user: userWithoutPassword, token });
};

export const verifyToken = async (req: Request, res: Response) => {
  if (!req.user)
    return res.status(401).json({ error: 'Usuário não autenticado.' });

  const userId = req.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  res.status(200).json({ user });
};

export const me = async (req: Request, res: Response) => {
  if (!req.user)
    return res.status(401).json({ error: 'Usuário não autenticado.' });

  res.status(200).json({ message: `Olá! Seu ID de usuário é ${req.user.id}` });
};
