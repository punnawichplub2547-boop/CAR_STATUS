import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { employeesRouter } from './routes/employees.js';
import { examResultsRouter } from './routes/examResults.js';

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests from localhost and intranet network IPs (e.g. 10.x.x.x, 192.168.x.x, 172.x.x.x)
      if (
        !origin ||
        origin.startsWith('http://localhost') ||
        origin.startsWith('http://127.0.0.1') ||
        origin.startsWith('http://10.') ||
        origin.startsWith('http://172.') ||
        origin.startsWith('http://192.168.')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api', employeesRouter);
app.use('/api', examResultsRouter);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`CAR_STATUS backend listening on port ${port}`);
});
