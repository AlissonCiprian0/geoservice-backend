import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

// Routes
import authRoutes from '@/routes/auth.routes.js';

// Middlewares
import { errorMiddleware } from '@/middlewares/errorMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors()); // Permite requisições do frontend
app.use(express.json()); // Permite requisições com corpo em Json

app.use('/api/auth', authRoutes);

app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
