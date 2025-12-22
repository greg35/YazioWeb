from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import os
import json

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

EXPORTER_DIR = os.path.join(os.path.dirname(__file__), "yazio-exporter")
EXPORTER_BIN = os.path.join(EXPORTER_DIR, "YazioExport")
DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "days.json")
TOKEN_FILE = os.path.join(EXPORTER_DIR, "token.txt")

@app.get("/api/status")
def get_status():
    """Check if exporter binary and token exist."""
    return {
        "exporter_exists": os.path.exists(EXPORTER_BIN),
        "token_exists": os.path.exists(TOKEN_FILE),
        "data_exists": os.path.exists(DATA_FILE)
    }

@app.get("/api/data")
def get_data():
    """Return the content of days.json."""
    if not os.path.exists(DATA_FILE):
        return {"error": "Data file not found"}
    try:
        with open(DATA_FILE, "r") as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/refresh")
def refresh_data():
    """Run the exporter to refresh data."""
    if not os.path.exists(EXPORTER_BIN):
        raise HTTPException(status_code=500, detail="Exporter binary not found")
    if not os.path.exists(TOKEN_FILE):
        raise HTTPException(status_code=400, detail="Token not found. Please login first.")

    # Command: ./YazioExport days -token token.txt -what all -out ../days.json
    # Note: We might need to adjust paths depending on where we run it from.
    # Let's run it from the exporter directory.
    
    cmd = [
        "./YazioExport",
        "days",
        "-token", "token.txt",
        "-what", "all",
        "-out", os.path.abspath(DATA_FILE)
    ]
    
    try:
        result = subprocess.run(
            cmd,
            cwd=EXPORTER_DIR,
            capture_output=True,
            text=True,
            check=True
        )
        return {"status": "success", "output": result.stdout}
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {e.stderr}")

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/api/login")
def login(request: LoginRequest):
    """Run the exporter login command."""
    # Command: ./YazioExport login email password -out token.txt
    # Note: The exporter might prompt for password if not provided in args, 
    # but based on usage it seems to accept args. 
    # Usage: ./YazioExport login yourmail yourpass -out token.txt
    
    cmd = [
        "./YazioExport",
        "login",
        request.email,
        request.password,
        "-out", "token.txt"
    ]
    
    try:
        result = subprocess.run(
            cmd,
            cwd=EXPORTER_DIR,
            capture_output=True,
            text=True,
            check=True
        )
        return {"status": "success", "message": "Login successful"}
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=401, detail=f"Login failed: {e.stderr}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
