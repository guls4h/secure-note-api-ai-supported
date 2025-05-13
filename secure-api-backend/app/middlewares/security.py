from fastapi import FastAPI
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from app.core.config import settings

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers to all responses to prevent XSS attacks."""
    
    def __init__(
        self,
        app: FastAPI,
        content_security_policy: str = None,
        enable_xss_protection: bool = True,
    ):
        super().__init__(app)
        self.content_security_policy = content_security_policy
        self.enable_xss_protection = enable_xss_protection
    
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        
        # Check if this is a docs route that needs special handling
        is_docs_route = False
        if any(docs_route in request.url.path for docs_route in [
            f"{settings.API_V1_PREFIX}/docs", 
            f"{settings.API_V1_PREFIX}/redoc", 
            f"{settings.API_V1_PREFIX}/openapi.json",
            f"{settings.API_V1_PREFIX}/docs/oauth2-redirect",
            # Include static doc resources
            f"{settings.API_V1_PREFIX}/docs/swagger-ui",
            "swagger-ui-bundle.js",
            "swagger-ui.css"
        ]):
            is_docs_route = True
        
        # Add security headers to prevent XSS attacks
        
        # X-XSS-Protection header forces browsers to block suspected XSS attacks
        if self.enable_xss_protection and not is_docs_route:
            response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # X-Content-Type-Options prevents browsers from interpreting files as a different MIME type
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # Content-Security-Policy restricts sources from which content can be loaded
        if self.content_security_policy and not is_docs_route:
            try:
                response.headers["Content-Security-Policy"] = self.content_security_policy
            except Exception:
                pass
        # Do not set CSP for docs routes at all - this allows Swagger UI to function properly
        
        # X-Frame-Options prevents clickjacking by disabling framing
        if not is_docs_route:
            response.headers["X-Frame-Options"] = "DENY"
        
        # Strict-Transport-Security ensures the browser only uses HTTPS
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        # Referrer-Policy controls how much referrer information is sent
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Permissions-Policy controls which browser features the site can use
        if not is_docs_route:
            response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), interest-cohort=()"
        
        return response 