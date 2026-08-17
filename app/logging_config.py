"""
Clario - Production Logging Configuration

Provides structured logging for the application with different levels
for development and production environments.
"""
import logging
import sys
from datetime import datetime
from typing import Optional, Any, Dict


def setup_logging(
    level: str = "INFO",
    log_file: Optional[str] = None,
    json_format: bool = False,
) -> logging.Logger:
    """
    Configure application logging.
    
    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Optional file path for log output
        json_format: If True, output in JSON format for log aggregation
        
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger("clario")
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))
    
    # Clear existing handlers
    logger.handlers.clear()
    
    # Create formatter
    if json_format:
        formatter = JSONFormatter()
    else:
        formatter = logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    console_handler.setLevel(logger.level)
    logger.addHandler(console_handler)
    
    # File handler (optional)
    if log_file:
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(formatter)
        file_handler.setLevel(logger.level)
        logger.addHandler(file_handler)
    
    return logger


class JSONFormatter(logging.Formatter):
    """Format log records as JSON for structured logging."""
    
    def format(self, record: logging.LogRecord) -> str:
        import json
        
        log_entry: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        
        if record.exc_info and record.exc_info[1]:
            log_entry["exception"] = str(record.exc_info[1])
        
        # Get any extra data passed via logging
        extra_data = {}
        for key in dir(record):
            if key.startswith("extra_") and not key.startswith("_"):
                try:
                    extra_data[key[6:]] = getattr(record, key)
                except Exception:
                    pass
        
        if extra_data:
            log_entry["data"] = extra_data
        
        return json.dumps(log_entry)


# Pre-configured logger instances for different parts of the app
def get_logger(name: str) -> logging.Logger:
    """Get a logger for a specific module."""
    return logging.getLogger(f"clario.{name}")


# Example usage:
# logger = get_logger("api")
# logger.info("Request processed", extra request_id="123", extra_duration=0.1)
