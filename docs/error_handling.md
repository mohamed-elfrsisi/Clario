# Clario - Error Handling Guide

This document describes how errors are handled throughout the Clario application.

## Error Handling Principles

1. **Never expose internal stack traces to users**
2. **Return clear, actionable error messages**
3. **Log detailed errors internally for debugging**
4. **Fail gracefully - never crash the entire application**

## API Error Responses

All API errors follow this format:
```json
{
    "detail": "Human-readable error message"
}
```

### HTTP Status Codes Used

| Status Code | When Used |
|-------------|-----------|
| 400 | Bad request - invalid input, unsupported file type, empty required field |
| 401 | Authentication required - missing or invalid token |
| 404 | Resource not found - document/opportunity/analysis doesn't exist |
| 409 | Conflict - duplicate email, resource already exists |
| 422 | Unprocessable - extracted no meaningful content |

## Common Error Scenarios

### Document Upload Errors

**Unsupported file type:**
```json
{
    "detail": "Unsupported file type '.xyz'. Supported: .pdf, .docx, .txt"
}
```

**Corrupted/unreadable file:**
```json
{
    "detail": "Could not read PDF: [specific error]"
}
```

**Empty document:**
```json
{
    "detail": "No extractable text found in PDF. It may be a scanned image without a text layer."
}
```

### Authentication Errors

**Missing token:**
```json
{
    "detail": "Missing or malformed Authorization header. Expected: Bearer <token>."
}
```

**Invalid token:**
```json
{
    "detail": "Invalid or expired token."
}
```

**Wrong credentials:**
```json
{
    "detail": "Incorrect email or password."
}
```
Note: Same message for non-existent user to prevent user enumeration.

### Validation Errors

**Empty required field:**
```json
{
    "detail": "At least one bullet is required."
}
```

**Short password:**
```json
{
    "detail": "Password must be at least 8 characters."
}
```

**Duplicate email:**
```json
{
    "detail": "An account with this email already exists."
}
```

### Analysis Errors

**No meaningful content extracted:**
```json
{
    "detail": "Could not extract meaningful content from the resume or opportunity text. Please check the input and try again."
}
```

**Document not found:**
```json
{
    "detail": "Document not found."
}
```

## Frontend Error Display

The Streamlit frontend displays errors as styled cards:

- **Error cards** (red): For errors that prevent operation
- **Warning cards** (yellow): For warnings that don't block but need attention
- **Success cards** (green): For successful operations
- **Info cards** (blue): For helpful information

Examples:
- "🔌 Cannot reach the backend. Please ensure the FastAPI server is running."
- "🔐 Session expired. Please log in again."
- "❌ Error 400: Unsupported file type '.xyz'."

## Logging

Internal errors are logged with full details for debugging. User-facing messages are sanitized.

**What gets logged:**
- Full exception details
- Stack traces (internal only)
- Request context (endpoint, user ID)
- Timestamps

**What doesn't get logged:**
- User document content (privacy)
- Passwords (security)
- Tokens (security)

## Recovery Behaviors

| Error | Recovery |
|-------|----------|
| Backend unavailable | Show error, prompt to check server |
| Auth expired | Clear session, redirect to login |
| Upload failed | Show specific error, allow retry |
| Analysis failed | Show error, suggest checking inputs |
| AI rewrite failed | Show error, allow retry or manual edit |

## Testing Error Cases

All error paths should be tested:

```bash
# Run integration tests that cover error cases
python -m pytest tests/test_api_integration.py -v -k "error or rejected or 401 or 404"
```

Specific error test cases:
- Upload unsupported file type → 400
- Login with wrong password → 401
- Access without token → 401
- Access another user's resource → 404
- Create opportunity with empty text → 400
- Rewrite empty bullet list → 400
- etc.
