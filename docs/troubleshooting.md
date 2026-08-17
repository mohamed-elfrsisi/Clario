# Clario - Troubleshooting Guide

## Quick Checks

### Server Won't Start

1. **Check Python version:**
   ```bash
   python3 --version  # Should be 3.12+
   ```

2. **Verify dependencies installed:**
   ```bash
   source .venv/bin/activate
   pip list | grep -E "fastapi|uvicorn|sqlalchemy|pdfplumber|python-docx"
   ```

3. **Check port availability:**
   ```bash
   lsof -i :8000  # Check if port 8000 is in use
   ```

4. **Try running directly:**
   ```bash
   uvicorn app.main:app --reload
   ```

### Database Issues

**SQLite file not found:**
- Ensure `DATABASE_URL` points to a writable location
- Default: `sqlite:///./clario.db` in project root
- Check file permissions

**Database locked:**
- SQLite can only handle one writer at a time
- For development, restart the server
- For production, use PostgreSQL

**Migration needed:**
- The app auto-creates tables on startup
- If schema changed, delete `clario.db` and restart
- Or use proper migration tools for production

### File Upload Errors

**"Unsupported file type":**
- Only `.pdf`, `.docx`, `.txt` are supported
- Check the file extension is correct

**"Could not read PDF":**
- PDF may be corrupted
- PDF may be scanned image without text layer
- Try a different PDF or convert to DOCX/TXT

**"DOCX file appears to be empty":**
- File may have no text content
- File may be password-protected
- Try a different DOCX file

**"Could not decode text file":**
- File encoding may not be UTF-8
- Try saving as UTF-8 or use a different encoding

### Authentication Errors

**"Session expired":**
- Tokens don't expire automatically in current implementation
- Try logging in again
- Clear browser cache/cookies if using web UI

**"Invalid or expired token":**
- Token may have been deleted from database
- Try logging in again

**"Incorrect email or password":**
- Check email spelling (case-sensitive)
- Reset password by creating new account

### Analysis Errors

**"Could not extract meaningful content":**
- Resume text too short or empty
- Opportunity text too short or empty
- No skills detected in either document
- Try with more detailed documents

**Match percentage is 0%:**
- No skills matched between resume and opportunity
- Check skill extraction is working
- Try with more obviously matching content

**"Document not found" / "Opportunity not found":**
- ID may be wrong or belong to another user
- Resource may have been deleted
- List your documents/opportunities to find correct IDs

### Frontend Issues

**"Cannot reach the backend":**
- Ensure uvicorn is running: `uvicorn app.main:app --reload`
- Check API_BASE_URL in Streamlit matches your backend URL
- Check firewall/network allows connections

**UI not updating:**
- Streamlit may need a refresh
- Try pressing R to hard refresh
- Check browser console for errors

**Stuck on loading:**
- Backend may have crashed
- Check backend logs
- Try the API directly with curl to verify it's working

### Docker Issues

**Build fails:**
- Check Dockerfile syntax
- Ensure `requirements.txt` is valid
- Check Python version compatibility (3.12-slim)

**Container won't start:**
```bash
docker compose logs clario  # Check logs
docker compose ps           # Check container status
docker compose up -d        # Try starting again
```

**Data not persisting:**
- Volume should be mounted: `clario_data:/app/data`
- Check volume exists: `docker volume ls`
- Don't use `docker compose down -v` unless you want to delete data

**Port conflict:**
- Change port mapping in docker-compose.yml
- Example: `"8001:8000"` to use port 8001

### Performance Issues

**Slow extraction:**
- Large documents take longer to process
- Taxonomy matching is O(n*m) where n=skills, m=text length
- For very large documents, consider chunking

**Slow API responses:**
- Database queries may be slow without indexes
- Add indexes for frequently queried fields
- Use Postgres instead of SQLite for production

### Testing Issues

**Tests fail:**
```bash
# Run with verbose output
python -m pytest tests/ -v --tb=long

# Run specific test
python -m pytest tests/test_local_extractor.py::test_extract_skills_basic -v
```

**Import errors:**
- Ensure you're in the project directory
- Ensure virtualenv is activated
- Check PYTHONPATH if running from different directory

**Database errors in tests:**
- Tests use temporary SQLite database
- Ensure temp directory is writable
- Clean up test artifacts if needed

## Common Solutions

### Reset Everything

```bash
# Delete database
rm -f clario.db

# Restart server
uvicorn app.main:app --reload
```

### Check API Directly

```bash
# Health check
curl http://localhost:8000/health

# Register
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"testpass123"}'

# Upload document
curl -X POST http://localhost:8000/documents/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@resume.txt"

# Run analysis
curl -X POST http://localhost:8000/analysis \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"document_id":"...","opportunity_id":"..."}'
```

### View Logs

**Local development:**
- Console output from uvicorn
- Set `LOG_LEVEL=debug` for more detail

**Docker:**
```bash
docker compose logs -f clario
```

### Get Help

1. Check existing documentation in `/docs`
2. Review API docs at `/docs` endpoint
3. Check test files for usage examples
4. Review code comments for implementation details
