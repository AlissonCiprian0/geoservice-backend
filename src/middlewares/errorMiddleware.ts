import type { Request, Response, NextFunction } from 'express';

export const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Para fins de depuração
  console.log('Erro capturado: ', error);

  // Trata erros inesperados no servidor (um erro que não foi previsto em nenhum controller)
  res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
};
