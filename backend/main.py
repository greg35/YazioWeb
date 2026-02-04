from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import os
import json
import hashlib
import secrets

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = os.getenv("DATA_DIR", "/data")
if not os.path.exists(DATA_DIR) or not os.access(DATA_DIR, os.W_OK):
    DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
    os.makedirs(DATA_DIR, exist_ok=True)

EXPORTER_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "yazio-exporter")
EXPORTER_BIN = os.path.join(EXPORTER_DIR, "YazioExport")
DATA_FILE = os.path.join(DATA_DIR, "days.json")
TOKEN_FILE = "token.txt"
CONFIG_FILE = os.path.join(DATA_DIR, "config.json")

# --- Security Helpers ---

def load_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r") as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_config(config):
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f)

def hash_password(password: str, salt: str = None) -> (str, str):
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.sha256((password + salt).encode()).hexdigest()
    return hashed, salt

# --- Endpoints ---

@app.get("/api/status")
def get_status():
    """Check if exporter binary, token exist, and if security is enabled."""
    config = load_config()
    return {
        "exporter_exists": os.path.exists(EXPORTER_BIN),
        "token_exists": os.path.exists(os.path.join(EXPORTER_DIR, TOKEN_FILE)),
        "data_exists": os.path.exists(DATA_FILE),
        "security_enabled": config.get("security_enabled", False)
    }

class SecuritySetRequest(BaseModel):
    password: str
    enabled: bool

@app.post("/api/security/set")
def set_security(request: SecuritySetRequest):
    """Set or disable password protection."""
    config = load_config()
    
    if request.enabled:
        if not request.password:
             raise HTTPException(status_code=400, detail="Password required to enable security")
        hashed, salt = hash_password(request.password)
        config["password_hash"] = hashed
        config["password_salt"] = salt
        config["security_enabled"] = True
    else:
        config["security_enabled"] = False
        # We don't necessarily need to delete the hash, but we can
        # config.pop("password_hash", None)
        # config.pop("password_salt", None)
    
    save_config(config)
    return {"status": "success", "security_enabled": config["security_enabled"]}

class VerifyRequest(BaseModel):
    password: str

@app.post("/api/security/verify")
def verify_security(request: VerifyRequest):
    """Verify password."""
    config = load_config()
    if not config.get("security_enabled", False):
        return {"success": True} # If disabled, always success
        
    stored_hash = config.get("password_hash")
    stored_salt = config.get("password_salt")
    
    if not stored_hash or not stored_salt:
        # Invalid state, allow entry to fix it or block? 
        # Safest is to allow if enabled but no pass (shouldn't happen) or block.
        # Let's say if enabled but data missing, fail.
        raise HTTPException(status_code=401, detail="Security configuration error")

    hashed, _ = hash_password(request.password, stored_salt)
    
    if hashed == stored_hash:
        return {"success": True}
    else:
        raise HTTPException(status_code=401, detail="Invalid password")

@app.get("/api/data")
def get_data():
    """Return the content of days.json."""
    PRODUCTS_FILE = os.path.join(DATA_DIR, "products.json")
    
    if not os.path.exists(DATA_FILE):
        return {"error": "Data file not found"}
    try:
        with open(DATA_FILE, "r") as f:
            data = json.load(f)
            
        # Load products if available
        product_map = {}
        if os.path.exists(PRODUCTS_FILE):
            try:
                with open(PRODUCTS_FILE, "r") as f:
                    products_data = json.load(f)
                    # Create a map of id -> {name, nutrients}
                    # products.json is a dict where key is id and value is object with name
                    if isinstance(products_data, dict):
                        for p_id, p_data in products_data.items():
                            product_map[p_id] = {
                                "name": p_data.get("name"),
                                "nutrients": p_data.get("nutrients", {}),
                                "base_unit": p_data.get("base_unit")
                            }
                    elif isinstance(products_data, list):
                        for p in products_data:
                            if "id" in p:
                                product_map[p["id"]] = {
                                    "name": p.get("name"),
                                    "nutrients": p.get("nutrients", {}),
                                    "base_unit": p.get("base_unit")
                                }
            except Exception as e:
                print(f"Error loading products.json: {e}")

        # Merge product names and nutrients
        if product_map:
            # Check if data is list or dict
            days_iterator = data.values() if isinstance(data, dict) else data
            
            for day_data in days_iterator:
                # day_data might be the day object directly or contain 'consumed'
                # Based on output: {"2025-11-28": {"daily": ..., "consumed": ...}}
                consumed = day_data.get("consumed", {})
                if "products" in consumed:
                    for product in consumed["products"]:
                        p_id = product.get("product_id")
                        if p_id and p_id in product_map:
                            p_info = product_map[p_id]
                            product["name"] = p_info["name"]
                            product["base_unit"] = p_info.get("base_unit")
                            
                            # Calculate nutrients based on amount
                            amount = product.get("amount", 0)
                            base_nutrients = p_info["nutrients"]
                            if base_nutrients:
                                product["nutrients"] = {
                                    k: v * amount for k, v in base_nutrients.items() if v is not None
                                }
                
                if "recipe_portions" in consumed:
                    for recipe in consumed["recipe_portions"]:
                        r_id = recipe.get("recipe_id")
                        if r_id:
                            if r_id in product_map:
                                r_info = product_map[r_id]
                                recipe["name"] = r_info["name"]
                                # Use default unit if not present (recipes often don't have base_unit at top level)
                                recipe["base_unit"] = r_info.get("base_unit", "g")
                                
                                # Calculate nutrients based on portion_count
                                count = recipe.get("portion_count", 0)
                                base_nutrients = r_info.get("nutrients")
                                if base_nutrients:
                                    recipe["nutrients"] = {
                                        k: v * count for k, v in base_nutrients.items() if v is not None
                                    }
                            else:
                                print(f"[WARNING] Recipe ID {r_id} found in day data but NOT in products.json. This usually means the exporter failed to fetch it or the regex didn't match.")
                        else:
                            print(f"[WARNING] Recipe portion found without recipe_id: {recipe}")
                            
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/refresh")
def refresh_data():
    """Run the exporter to refresh data."""
    if not os.path.exists(EXPORTER_BIN):
        raise HTTPException(status_code=500, detail="Exporter binary not found")
    if not os.path.exists(os.path.join(EXPORTER_DIR, TOKEN_FILE)):
        raise HTTPException(status_code=400, detail="Token not found. Please login first.")

    # Command: ./YazioExport days -token token.txt -what all -out ../days.json
    # And: ./YazioExport products -token token.txt -from ../days.json -o ../products.json
    
    cmd_days = [
        "./YazioExport",
        "days",
        "-token", TOKEN_FILE,
        "-what", "all",
        "-out", DATA_FILE
    ]

    PRODUCTS_FILE = os.path.join(DATA_DIR, "products.json")
    cmd_products = [
        "./YazioExport",
        "products",
        "-token", TOKEN_FILE,
        "-from", DATA_FILE,
        "-o", PRODUCTS_FILE
    ]
    
    try:
        # Run days export
        subprocess.run(
            cmd_days,
            cwd=EXPORTER_DIR,
            capture_output=True,
            text=True,
            check=True
        )
        
        # Run products export
        result = subprocess.run(
            cmd_products,
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
        "-out", TOKEN_FILE
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

# --- Static File Serving ---
# Mount static files and handle SPA routing
# This must be placed after API routes to ensure API calls are not swallowed if namespaces collide
# essentially, we rely on FastAPI matching specific API routes first.

static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")

if os.path.exists(static_dir):
    # Mount assets folder for direct access (e.g., /assets/index-D1...js)
    assets_dir = os.path.join(static_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    # Catch-all for SPA
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Prevent API paths from returning HTML (though they should be matched by now)
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")

        # Check if a physical file exists (e.g. favicon.ico, manifest.json)
        file_path = os.path.join(static_dir, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        
        # Otherwise serve index.html
        return FileResponse(os.path.join(static_dir, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
