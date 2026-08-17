# Clario Deployment Guide

This guide covers deployment options for the Clario application.

## Quick Start with Docker

The easiest way to deploy Clario is using Docker Compose.

### Prerequisites

- Docker and Docker Compose installed
- Port 8000 available (or configure a different port)

### Deploy

```bash
# Clone the repository
git clone <repository-url> clario
cd clario

# Build and start
docker compose up --build -d

# Check status
docker compose ps

# View logs
docker compose logs -f clario
```

### Access

- API: `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`
- Health Check: `curl http://localhost:8000/health`

### Frontend

The Streamlit frontend runs separately. To run it:

```bash
# Option 1: Run locally (requires Python environment)
cd frontend
pip install -r requirements.txt
streamlit run streamlit_app.py

# Option 2: In production, deploy Streamlit separately or integrate into a single container
```

### Stop and Cleanup

```bash
# Stop containers (preserve data)
docker compose down

# Stop and remove volumes (delete all data)
docker compose down -v

# Restart
docker compose up -d
```

## Configuration

### Environment Variables

Create a `.env` file or set environment variables:

```bash
# Database (SQLite for simple deployments, Postgres for production)
DATABASE_URL=sqlite:////app/data/clario.db

# Or PostgreSQL:
# DATABASE_URL=postgresql://clario:password@postgres:5432/clario

# Server
HOST=0.0.0.0
PORT=8000

# Security
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=https://your-frontend-domain.com

# Logging
LOG_LEVEL=info
LOG_FILE=/app/data/clario.log
```

### Docker Compose Configuration

The `docker-compose.yml` includes:

- **clario service**: FastAPI backend
- **Volume**: `clario_data` for persistent SQLite storage
- **Optional postgres service**: Uncomment for PostgreSQL

To use PostgreSQL:

1. Uncomment the postgres service in docker-compose.yml
2. Uncomment postgres_data volume
3. Set DATABASE_URL to PostgreSQL connection string
4. Add `depends_on: [postgres]` to clario service

## Production Deployment

### Options

1. **Single Docker Container** (recommended for small deployments)
   - Use the provided Dockerfile
   - SQLite for storage (with volume persistence)
   - Suitable for demo, testing, small-scale use

2. **Docker Compose with PostgreSQL** (recommended for production)
   - Separate Postgres container
   - Better concurrency and reliability
   - Easier backups

3. **Manual Deployment** (for full control)
   - Install Python 3.12+
   - Set up virtual environment
   - Install dependencies
   - Configure and run uvicorn with a process manager (systemd, supervisor, etc.)
   - Set up PostgreSQL
   - Configure reverse proxy (nginx, Apache) with HTTPS

### Security Checklist

- [ ] Change default SECRET_KEY
- [ ] Set specific CORS_ORIGINS (not `*`)
- [ ] Use HTTPS in production
- [ ] Configure ALLOWED_HOSTS
- [ ] Use environment variables for secrets (never commit .env)
- [ ] Set up regular database backups
- [ ] Monitor logs for errors
- [ ] Keep dependencies updated
- [ ] Review and restrict file upload limits

### Process Management

For non-Docker deployments, use a process manager:

**systemd example** (`/etc/systemd/system/clario.service`):

```ini
[Unit]
Description=Clario API
After=network.target

[Service]
User=clario
Group=clario
WorkingDirectory=/opt/clario
Environment="DATABASE_URL=postgresql://clario:password@localhost:5432/clario"
Environment="SECRET_KEY=your-secret"
Environment="LOG_LEVEL=info"
ExecStart=/opt/clario/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable clario
sudo systemctl start clario
sudo systemctl status clario
```

### Reverse Proxy (nginx)

```nginx
server {
    listen 80;
    server_name clario.example.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

For HTTPS, use Let's Encrypt or your preferred certificate authority.

### Scaling

For high-traffic deployments:

- Use PostgreSQL instead of SQLite
- Add a load balancer (nginx, HAProxy, cloud LB)
- Run multiple backend instances
- Consider caching for frequently accessed data
- Monitor and scale based on metrics

## Health Checks

The API exposes a health endpoint:

```bash
curl http://localhost:8000/health
# Returns: {"status": "ok"}
```

Use this for:
- Load balancer health checks
- Monitoring systems
- Deployment verification

## Monitoring

### Logs

Logs are output to stdout by default. Configure LOG_FILE for file output.

**Docker:**
```bash
docker compose logs -f clario
```

**Systemd:**
```bash
journalctl -u clario -f
```

### Metrics

Consider adding metrics endpoints for monitoring systems (Prometheus, etc.) in future versions.

### Error Tracking

Integrate with error tracking services (Sentry, Rollbar, etc.) by:
- Adding the SDK to the application
- Configuring with DSN from environment variable
- Capturing exceptions

## Backup and Recovery

### SQLite

```bash
# Backup
sqlite3 clario.db ".backup backup.db"

# Or copy the file
cp clario.db clario-backup-$(date +%Y%m%d).db
```

### PostgreSQL

```bash
# Backup
pg_dump -h localhost -U clario clario > backup.sql

# Restore
psql -h localhost -U clario clario < backup.sql
```

### Docker Volumes

```bash
# Backup volume
docker run --rm -v clario_data:/data -v $(pwd):/backup alpine tar czf /backup/clario-data-backup.tar.gz -C /data .

# Restore
docker run --rm -v clario_data:/data -v $(pwd):/backup alpine tar xzf /backup/clario-data-backup.tar.gz -C /data
```

## Troubleshooting

See [Troubleshooting Guide](./docs/troubleshooting.md) for detailed help.

### Common Deployment Issues

**Container exits immediately:**
```bash
docker compose logs clario  # Check error logs
docker compose up clario    # Start in foreground to see output
```

**Cannot connect to database:**
- Check DATABASE_URL is correct
- For PostgreSQL, ensure postgres service is running
- Check network connectivity between containers

**CORS errors from frontend:**
- Verify CORS_ORIGINS includes your frontend domain
- Check browser console for specific error

**Slow performance:**
- Use PostgreSQL for production
- Add database indexes
- Monitor resource usage
- Consider caching

## Updating

### Docker

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker compose down
docker compose up --build -d

# Check health
curl http://localhost:8000/health
```

### Manual

```bash
# Pull changes
git pull

# Activate environment
source .venv/bin/activate

# Update dependencies
pip install -r requirements.txt

# Restart service
sudo systemctl restart clario
```

## Rollback

If an update causes issues:

**Docker:**
```bash
# Revert to previous image/tag
docker compose down
# Edit docker-compose.yml to use previous image
docker compose up -d
```

**Manual:**
```bash
# Revert code
git checkout <previous-commit>

# Restart
sudo systemctl restart clario
```

## Support

- Check documentation in `/docs`
- Review API docs at `/docs` endpoint
- Check logs for errors
- Test API directly with curl
