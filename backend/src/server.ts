import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { employeesRouter } from './routes/employees.js';
import { examResultsRouter } from './routes/examResults.js';

const app = express();

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
  : ['http://localhost:5173', 'http://localhost:8088'];

app.use(cors({ origin: corsOrigins }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api', employeesRouter);
app.use('/api', examResultsRouter);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`CAR_STATUS backend listening on port ${port}`);
});
