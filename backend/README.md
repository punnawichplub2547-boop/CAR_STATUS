# CAR_STATUS Backend

Express + Prisma + MySQL API. Phase 1 scope: employee lookup for the F-HR-002
name list, and a webhook that receives orientation exam scores from a Google
Form (via Google Apps Script) in real time. Phase 2 (in progress): OJT
(F-HR-004) and Probation (F-HR-009) evaluations.

## Local setup

```bash
cd backend
npm install
cp .env.example .env        # then edit DATABASE_URL / WEBHOOK_SECRET

# start MySQL (or point DATABASE_URL at an existing instance)
docker compose up -d car-status-mysql

npx prisma migrate dev      # creates tables from prisma/schema.prisma
npm run prisma:seed         # seeds the 2 fixed F-HR-002 courses
npm run dev                 # http://localhost:4000
```

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | liveness check |
| GET | `/api/employees` | all employees |
| GET | `/api/employees/pending-orientation` | new employees not yet passed both exams, oldest start date first, each with `examStatus.REGULATION` / `.SAFETY` (latest attempt or `null`) — feeds the F-HR-002 export name list and its per-person exam status column |
| POST | `/api/employees` | create an employee |
| PUT | `/api/employees/:id` | update an employee |
| DELETE | `/api/employees/:id` | delete an employee — cascades their training attendance rows, nulls out `employeeId` on their exam submissions (score history is kept) |
| GET | `/api/exam-results?empCode=EMP-1234` | exam submissions, optionally filtered |
| GET | `/api/exam-results/:empCode` | one employee's submissions |
| POST | `/api/webhook/exam-result` | called by Google Apps Script on form submit — requires `X-Webhook-Secret` header matching `WEBHOOK_SECRET` |
| POST | `/api/ojt-sessions` | create an OJT session (F-HR-004) with its content lines and participants in one write; each participant's `empCode` is resolved to a backend employee if one matches |
| GET | `/api/ojt-sessions?empCode=EMP-1234` | OJT sessions, optionally filtered to ones a given employee participated in |
| POST | `/api/probation-evaluations` | create a probation evaluation (F-HR-009); `empCode` resolved to a backend employee if one matches |
| GET | `/api/probation-evaluations?empCode=EMP-1234` | probation evaluations, optionally filtered |

## Google Form → backend wiring

See `apps-script/Code.gs`. Paste it into the Apps Script editor bound to the
response Sheet, set the `WEBHOOK_URL` / `WEBHOOK_SECRET` Script Properties,
and install an "On form submit" trigger — the file has the exact steps and
the expected form question titles in its header comment.

Pass criteria (matches the flow chart):
- **REGULATION** course: percentage ≥ 80%
- **SAFETY** course: wrong answers ≤ 2

An employee's `orientationPassed` flag flips to `true` automatically once
both categories have a passing submission.
