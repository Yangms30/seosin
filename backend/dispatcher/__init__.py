"""Channel dispatchers: web (DB), slack, email."""
from .service import dispatch_user_reports

__all__ = ["dispatch_user_reports"]
