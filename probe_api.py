import requests
import os
import json
from datetime import datetime

TOKEN_FILE = "backend/yazio-exporter/token.txt"

def probe_endpoints():
    if not os.path.exists(TOKEN_FILE):
        print("Token file not found")
        return

    with open(TOKEN_FILE, "r") as f:
        token = f.read().strip()

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }

    base_url = "https://yzapi.yazio.com"
    endpoints = [
        f"/v9/user/goals?date=2025-12-23",
        f"/v9/user/goals?date=2025-12-22",
        f"/v9/user/goals?date=2025-12-16",
        f"/v9/user/goals?date=2025-12-01",
    ]

    for ep in endpoints:
        url = base_url + ep
        try:
            print(f"Probing {url}...")
            response = requests.get(url, headers=headers)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                print("Response:", response.text[:200]) # Print first 200 chars
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    probe_endpoints()
