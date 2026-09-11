import os
import json
import uuid
from datetime import datetime
from threading import Lock
from werkzeug.security import generate_password_hash, check_password_hash

class DataStore:
    def __init__(self, data_dir=None):
        if data_dir is None:
            backend_dir = os.path.dirname(os.path.abspath(__file__))
            self.data_dir = os.path.join(backend_dir, "data")
        else:
            self.data_dir = data_dir
        os.makedirs(self.data_dir, exist_ok=True)
        self.reports_file = os.path.join(self.data_dir, "reports.json")
        self.sensors_file = os.path.join(self.data_dir, "sensors.json")
        self.users_file = os.path.join(self.data_dir, "users.json")
        self.lock = Lock()
        
        # Initialize files with empty arrays if they don't exist
        self._init_file(self.reports_file, [])
        self._init_file(self.sensors_file, [])
        self._init_file(self.users_file, [])
        
        # Seed default reports if file is empty
        self._seed_default_data()

    def _init_file(self, filepath, default_val):
        if not os.path.exists(filepath):
            with open(filepath, "w") as f:
                json.dump(default_val, f, indent=4)

    def _read_json(self, filepath):
        with self.lock:
            try:
                with open(filepath, "r") as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error reading {filepath}: {e}")
                return []

    def _write_json(self, filepath, data):
        with self.lock:
            try:
                with open(filepath, "w") as f:
                    json.dump(data, f, indent=4)
                return True
            except Exception as e:
                print(f"Error writing {filepath}: {e}")
                return False

    def get_all_reports(self):
        return self._read_json(self.reports_file)

    def get_report_by_id(self, report_id):
        reports = self.get_all_reports()
        for r in reports:
            if r["id"] == report_id:
                return r
        return None

    def add_report(self, report_data):
        reports = self.get_all_reports()
        
        # Supply defaults
        report = {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "crop": report_data.get("crop", "Unknown"),
            "disease": report_data.get("disease", "Unknown"),
            "severity": report_data.get("severity", "Medium"),
            "status": report_data.get("status", "Unverified"),
            "latitude": float(report_data.get("latitude", 29.5)),
            "longitude": float(report_data.get("longitude", 76.5)),
            "image_url": report_data.get("image_url", ""),
            "confidence": float(report_data.get("confidence", 100.0)),
            "farmer_notes": report_data.get("farmer_notes", ""),
            "expert_notes": report_data.get("expert_notes", "")
        }
        
        reports.append(report)
        self._write_json(self.reports_file, reports)
        return report

    def update_report_status(self, report_id, status, expert_notes="", corrected_disease=None):
        reports = self.get_all_reports()
        updated_report = None
        
        for r in reports:
            if r["id"] == report_id:
                r["status"] = status
                r["expert_notes"] = expert_notes
                if corrected_disease:
                    r["disease"] = corrected_disease
                updated_report = r
                break
                
        if updated_report:
            self._write_json(self.reports_file, reports)
        return updated_report

    def get_all_sensor_logs(self):
        return self._read_json(self.sensors_file)

    def add_sensor_log(self, log_data):
        logs = self.get_all_sensor_logs()
        log = {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "temperature": float(log_data.get("temperature", 25.0)),
            "humidity": float(log_data.get("humidity", 60.0)),
            "soil_moisture": float(log_data.get("soil_moisture", 45.0)),
            "pest_count": int(log_data.get("pest_count", 0)),
            "notes": log_data.get("notes", "")
        }
        logs.append(log)
        self._write_json(self.sensors_file, logs)
        return log

    def get_all_users(self):
        return self._read_json(self.users_file)

    def get_user_by_email(self, email):
        if not email:
            return None
        users = self.get_all_users()
        clean_email = email.strip().lower()
        for u in users:
            if u.get("email", "").lower() == clean_email:
                return u
        return None

    def add_user(self, user_data):
        email = user_data.get("email", "").strip().lower()
        if not email:
            return None, "Email is required"
        if self.get_user_by_email(email):
            return None, "An account with this email already exists"

        password = user_data.get("password", "")
        if not password or len(password) < 6:
            return None, "Password must be at least 6 characters long"

        users = self.get_all_users()
        user = {
            "id": str(uuid.uuid4()),
            "email": email,
            "password_hash": generate_password_hash(password),
            "full_name": user_data.get("full_name", "").strip() or "Farmer Friend",
            "village": user_data.get("village", "").strip() or "Local Village",
            "district": user_data.get("district", "").strip() or "Local District",
            "role": user_data.get("role", "farmer"),
            "created_at": datetime.utcnow().isoformat() + "Z"
        }
        users.append(user)
        if self._write_json(self.users_file, users):
            clean_user = {k: v for k, v in user.items() if k != "password_hash"}
            return clean_user, None
        return None, "Failed to save user"

    def authenticate_user(self, email, password):
        user = self.get_user_by_email(email)
        if not user:
            return None, "Account not found with this email"
        if not check_password_hash(user.get("password_hash", ""), password):
            return None, "Invalid password"
        clean_user = {k: v for k, v in user.items() if k != "password_hash"}
        return clean_user, None

    def _seed_default_data(self):
        pass



