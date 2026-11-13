import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { rotaNaoEncontrada, tratarErros } from './middlewares/erro';
import { rotas } from './routes';
import './types';

export const app = express();

app.set('trust proxy', 1); // atrás do Nginx
app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((o) => o.trim()),
  }),
);
app.use(express.json({ limit: '100kb' }));

app.use('/api', rotas);
app.use(rotaNaoEncontrada);
app.use(tratarErros);
