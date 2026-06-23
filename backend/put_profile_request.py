import requests
import json

url = 'http://localhost:5000/api/profile'
payload = {
    "aadhaar_last4": "9012",
    "aadhaar_status": "pending",
    "address": "123 Anna Nagar, Chennai",
    "completion_percent": 100,
    "email": "shriramvibrion7@gmail.com",
    "first_name": "SHRIRAM",
    "gender": "Male",
    "last_login_at": "2026-06-08T16:45:48",
    "last_name": "A",
    "notifications": {"email": True, "sms": True},
    "pan_last4": "234F",
    "pan_number": None,
    "pan_status": "pending",
    "phone": "7550207665",
    "user_Id": 2
}

resp = requests.put(url, json=payload)
print(resp.status_code)
print(resp.text)
