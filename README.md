# Payments dashboard

Full-stack **NestJS + React** app with Postgres, Dockerised — aimed at transactional data for the Mexican market.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Quick Start (Docker)](#quick-start-docker)
- [Running Locally (without Docker)](#running-locally-without-docker)
- [API Reference](#api-reference)
- [Running Tests](#running-tests)
- [Scalability Notes](#scalability-notes)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   docker-compose                      │
│                                                       │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────┐ │
│  │   React UI   │──▶│  NestJS API  │──▶│Postgres  │ │
│  │  :5173       │   │  :3000       │   │  :5432   │ │
│  └──────────────┘   └──────────────┘   └──────────┘ │
└─────────────────────────────────────────────────────┘
```

**Backend** (`/backend`) — NestJS + TypeORM + PostgreSQL
- `POST /users` — user registration
- `POST /transactions` — single ingest (API Key protected)
- `POST /transactions/bulk` — bulk ingest (idempotent, API Key protected)
- `GET  /transactions` — list with optional filters
- `GET  /summary/accounts` — balance per account
- `GET  /summary/categories` — spend/income per category
- `GET  /docs` — Swagger UI

**Frontend** (`/frontend`) — React + Vite + Recharts
- Dashboard with area/bar charts
- Transactions browser with account & date filters
- Summary page with pie charts + account bar chart
- Users registration
- Ingest page (single + bulk JSON form)

---

## Quick Start (Docker)

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) ≥ 24
- [Docker Compose](https://docs.docker.com/compose/) ≥ 2

### 1. Clone & configure

```bash
git clone <your-repo-url>
cd payments-dashboard

# Copy env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Start everything

```bash
docker compose up --build
```

| Service      | URL                              |
|--------------|----------------------------------|
| Frontend     | http://localhost:5173            |
| Backend API  | http://localhost:3000            |
| Swagger Docs | http://localhost:3000/docs       |
| PostgreSQL   | localhost:5432                   |

### 3. Stop

```bash
docker compose down          # stop containers
docker compose down -v       # stop + remove volumes (wipes DB)
```

---

## Running Locally (without Docker)

### Prerequisites

- Node.js ≥ 20
- PostgreSQL ≥ 15 running locally

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your local DATABASE_URL

npm install
npm run start:dev
```

### Frontend

```bash
cd frontend
cp .env.example .env

npm install
npm run dev
```

---

## API Reference

### Authentication

Transaction ingestion endpoints require an API key in the request header:

```
X-API-Key: <your-api-key>
```

The default development key is `super-secret-api-key-change-in-production` (set in `.env`).

### Endpoints

#### Register User
```http
POST /users
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@email.com",
  "password": "!HorsePurpleHatRun9"
}
```

#### Ingest Single Transaction
```http
POST /transactions
X-API-Key: <api-key>
Content-Type: application/json

{
  "reference": "000051",
  "account": "S00099",
  "date": "2020-01-13",
  "amount": "-51.13",
  "type": "outflow",
  "category": "groceries"
}
```

#### Ingest Bulk Transactions (idempotent)
```http
POST /transactions/bulk
X-API-Key: <api-key>
Content-Type: application/json

{
  "transactions": [
    { "reference": "000051", "account": "S00099", "date": "2020-01-13", "amount": "-51.13", "type": "outflow", "category": "groceries" },
    { "reference": "000052", "account": "C00099", "date": "2020-01-14", "amount": "2500.72", "type": "inflow",  "category": "salary" }
  ]
}
```

Response:
```json
{ "created": 2, "skipped": 0, "errors": [] }
```

#### Account Summary
```http
GET /summary/accounts?startDate=2020-01-01&endDate=2020-12-31
```

Response:
```json
[
  { "account": "C00099", "balance": "1738.87", "total_inflow": "2500.72", "total_outflow": "-761.85" },
  { "account": "S00012", "balance": "150.72",  "total_inflow": "150.72",  "total_outflow": "0.00" }
]
```

#### Category Summary
```http
GET /summary/categories
```

Response:
```json
{
  "inflow":  { "salary": "2500.72", "savings": "150.72" },
  "outflow": { "groceries": "-51.13", "rent": "-560.00", "transfer": "-150.72" }
}
```

---

## Running Tests

### Backend

```bash
cd backend
npm test              # all unit tests
npm run test:cov      # with coverage report
```

Test coverage:
- `UsersService` — registration, duplicate email detection, password hashing
- `TransactionsService` — inflow/outflow validation, idempotency, bulk ingestion, error collection
- `SummaryService` — account balance aggregation, category grouping

### Frontend

```bash
cd frontend
npm test              # Vitest unit tests
```

---

## Scalability Notes

### If traffic blew up (rough ideas)

**Database layer**
- Add composite indexes on `(account, date)` and `(category, type)` for the summary queries (currently the biggest N+1 risk).
- Move to read replicas (e.g. AWS RDS Multi-AZ). Route all `GET` queries to read replicas, writes to primary.
- Introduce a caching layer (Redis) for account/category summaries with a short TTL (e.g. 60 s). Summary endpoints are expensive aggregations that don't need to be realtime.

**API layer**
- Horizontally scale the NestJS service behind a load balancer (ECS/Kubernetes). Each instance is stateless.
- Add rate limiting per API key to prevent abuse.

**Transaction ingestion**
- The synchronous bulk endpoint becomes a bottleneck under heavy load. Move to an **async queue** (e.g. AWS SQS + Lambda workers or Kafka consumers) — accept the payload, enqueue it, return `202 Accepted`, process in the background.

### Heavy daily volume from one customer

1. **Async ingestion queue** — Replace the synchronous `POST /transactions/bulk` with a message queue (Kafka or SQS). The API publishes the batch to a topic and returns immediately. Workers consume and insert in parallel with configurable concurrency.

2. **Batch upserts** — Replace the current row-by-row insert loop with a single PostgreSQL `INSERT ... ON CONFLICT (reference) DO NOTHING` bulk statement. This reduces 100k round-trips to a single query per batch.

3. **Partitioning** — Partition the `transactions` table by month (`PARTITION BY RANGE (date)`). This keeps query planners fast and allows old partitions to be archived cheaply.

4. **Dedicated ingestion service** — Separate the write path (ingestion) from the read path (dashboard queries) into independent services so dashboard queries never compete with write throughput.

---

## Project Structure

```
payments-dashboard/
├── backend/
│   ├── src/
│   │   ├── auth/            # API Key guard
│   │   ├── users/           # User registration module
│   │   ├── transactions/    # Transaction ingestion module
│   │   ├── summary/         # Summary aggregation module
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/           # Dashboard, Transactions, Summary, Users, Ingest
│   │   ├── hooks/           # useApi hook
│   │   ├── services/        # API client (axios)
│   │   └── index.css        # Global styles
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```
