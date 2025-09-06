import type { Request, Response } from 'express';
import type { RegisterUserDto } from '@/types/user.types.js';

import prisma from '@/lib/prisma.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const register = async (req: Request, res: Response) => {
  try {
    const body: RegisterUserDto = req.body;

    const { email, password } = body;

    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser)
      return res.status(409).json({ error: 'Email já está em uso.' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Não foi possível registrar o usuário.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user)
      return res.status(404).json({ error: 'Usuário não encontrado.' });

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid)
      return res.status(401).json({ error: 'Senha inválida.' });

    // Gerar o token JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, {
      expiresIn: '1d',
    });

    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
  }
};

export const verifyToken = async (req: Request, res: Response) => {
  if (!req.user)
    return res.status(401).json({ error: 'Usuário não autenticado.' });

  const userId = req.user.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
  }
};

export const me = async (req: Request, res: Response) => {
  if (!req.user)
    return res.status(401).json({ error: 'Usuário não autenticado.' });

  res.status(200).json({ message: `Olá! Seu ID de usuário é ${req.user.id}` });
};
