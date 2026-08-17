# Using 3.12, not 3.14 — the whole project's earlier setup pain (pydantic-core
# build failures, passlib/bcrypt incompatibility) traced back to 3.14 being
# too new for some packages' prebuilt wheels. 3.12 is stable and well-supported.
FROM python:3.12-slim

WORKDIR /app

# System deps needed by pdfplumber/cryptography (via pdfminer.six) to build
# if a wheel isn't available for this platform.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

# SQLite file lives here if DATABASE_URL isn't overridden to Postgres —
# mounted as a volume in docker-compose.yml so data survives container restarts.
RUN mkdir -p /app/data

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
