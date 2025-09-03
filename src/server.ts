import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from './lib/prisma.js';

import { authMiddleware } from '@/middlewares/authMiddleware.js';

import type { RegisterUserDto } from '@/types/user.types.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares essenciais
app.use(cors()); // Permite requisições do frontend
app.use(express.json()); // Permite requisições com corpo em Json

app.post('/api/auth/register', async (req, res) => {
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
});

app.post('/api/auth/login', async (req, res) => {
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
});

app.get('/api/auth/verify-token', authMiddleware, async (req, res) => {
  // O authMiddleware adicionou o 'req.user'.
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
});

app.get('/api/me', authMiddleware, async (req, res) => {
  if (!req.user)
    return res.status(401).json({ error: 'Usuário não autenticado.' });

  res.status(200).json({ message: `Olá! Seu ID de usuário é ${req.user.id}` });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
