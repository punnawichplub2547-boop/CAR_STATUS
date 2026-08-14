import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { employeesRouter } from './routes/employees.js';
import { examResultsRouter } from './routes/examResults.js';
import { ojtRouter } from './routes/ojt.js';
import { probationRouter } from './routes/probation.js';
import { skillEvaluationsRouter } from './routes/skillEvaluations.js';
import { skillStandardsRouter } from './routes/skillStandards.js';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' }));
// Express's default json() body limit is 100kb — too small for
// Employee.avatar, which stores a raw base64 data URL from the frontend's
// FileReader upload (unresized photos routinely land in the 1-4MB range).
app.use(express.json({ limit: '15mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api', employeesRouter);
app.use('/api', examResultsRouter);
app.use('/api', ojtRouter);
app.use('/api', probationRouter);
app.use('/api', skillEvaluationsRouter);
app.use('/api', skillStandardsRouter);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`CAR_STATUS backend listening on port ${port}`);
});
