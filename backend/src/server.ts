import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { employeesRouter } from './routes/employees.js';
import { examResultsRouter } from './routes/examResults.js';
import { ojtRouter } from './routes/ojt.js';
import { probationRouter } from './routes/probation.js';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api', employeesRouter);
app.use('/api', examResultsRouter);
app.use('/api', ojtRouter);
app.use('/api', probationRouter);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`CAR_STATUS backend listening on port ${port}`);
});
