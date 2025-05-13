from fastapi import APIRouter

# Import route modules directly
from app.api.routes.auth import router as auth_router
from app.api.routes.users import router as users_router
from app.api.routes.notes import router as notes_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["authentication"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(notes_router, prefix="/notes", tags=["notes"]) 