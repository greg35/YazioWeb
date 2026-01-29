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

DATA_DIR = os.getenv("DATA_DIR", "/data")
if not os.path.exists(DATA_DIR) or not os.access(DATA_DIR, os.W_OK):
    DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
    os.makedirs(DATA_DIR, exist_ok=True)

EXPORTER_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "yazio-exporter")
EXPORTER_BIN = os.path.join(EXPORTER_DIR, "YazioExport")
DATA_FILE = os.path.join(DATA_DIR, "days.json")
TOKEN_FILE = "token.txt"

@app.get("/api/status")
def get_status():
    """Check if exporter binary and token exist."""
    return {
        "exporter_exists": os.path.exists(EXPORTER_BIN),
        "token_exists": os.path.exists(os.path.join(EXPORTER_DIR, TOKEN_FILE)),
        "data_exists": os.path.exists(DATA_FILE)
    }

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
                        if r_id and r_id in product_map:
                            r_info = product_map[r_id]
                            recipe["name"] = r_info["name"]
                            recipe["base_unit"] = r_info.get("base_unit")
                            
                            # Calculate nutrients based on portion_count
                            count = recipe.get("portion_count", 0)
                            base_nutrients = r_info["nutrients"]
                            if base_nutrients:
                                # Start with direct multiplication (assuming nutrients are per portion or normalized to portion)
                                # If the API returns nutrients per 100g for recipes, we might be in trouble without total weight.
                                # But usually for recipes, Yazio works with portions.
                                recipe["nutrients"] = {
                                    k: v * count for k, v in base_nutrients.items() if v is not None
                                }
                            
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
