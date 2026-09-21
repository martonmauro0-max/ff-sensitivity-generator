from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes_devices import router as devices_router
from backend.routes_sensitivities import router as sensitivities_router
from backend.routes_admin import router as admin_router

app = FastAPI(title="FF Sensitivity Generator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



app.include_router(devices_router)
app.include_router(sensitivities_router)

@app.get("/health")
def health():
    return {
        "status": "ok",
        "message": "FF Sensitivity Generator Backend OK"
    }

app.include_router(admin_router)
