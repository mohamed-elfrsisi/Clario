# Deployment (Docker)

## Prerequisites
- Docker and Docker Compose installed on your machine.

## Run locally with Docker

```bash
docker compose up --build
```

The API will be live at `http://localhost:8000`, with interactive docs at
`http://localhost:8000/docs`. Data persists in a Docker volume
(`clario_data`) even if you stop/restart the container — a fresh
`docker compose down` followed by `up` keeps your data; `docker compose down -v`
deletes the volume and starts clean.

## Switching to Postgres

By default this runs on SQLite (fine for small-scale/demo use). To use
Postgres instead:

1. In `docker-compose.yml`, uncomment the `postgres` service block and the
   `postgres_data` volume.
2. Change the `clario` service's `DATABASE_URL` to:
   ```
   DATABASE_URL=postgresql://clario:clario@postgres:5432/clario
   ```
3. Add `depends_on: [postgres]` under the `clario` service.
4. `docker compose up --build`

## Environment variables

| Variable | Default | Notes |
|---|---|---|
| `DATABASE_URL` | `sqlite:////app/data/clario.db` | Set via docker-compose; override for Postgres |

No API keys are required — the extraction/matching/explanation pipeline
runs entirely locally (see Sprint 2/3 history: this project deliberately
moved away from external LLM APIs).

## Verifying it works

```bash
curl http://localhost:8000/health
# {"status":"ok"}
```

Then register a test account and confirm the protected endpoints respond:

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"testpass123"}'
```

## Known limitation (please verify and report back)

This Dockerfile/compose setup was written carefully but **not run in a live
Docker environment** during development — the build environment used to
develop Clario doesn't have Docker available. Everything it depends on
(the exact `DATABASE_URL` format, the Python 3.12 base image compatibility
with `requirements.txt`) was verified independently, but the actual
`docker build` / `docker compose up` has not been executed end-to-end.
Please run it and report any errors.
