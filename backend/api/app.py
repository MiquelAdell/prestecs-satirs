from fastapi import FastAPI

from backend.api.routes.auth_routes import router as auth_router
from backend.api.routes.games import router as games_router
from backend.api.routes.loans import router as loans_router
from backend.api.routes.admin import router as admin_router
from backend.api.routes.members import router as members_router


def create_app() -> FastAPI:
    app = FastAPI(title="Prestecs Satirs", version="0.1.0")

    app.include_router(games_router)
    app.include_router(auth_router)
    app.include_router(loans_router)
    app.include_router(members_router)
    app.include_router(admin_router)

    @app.get("/api/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app
