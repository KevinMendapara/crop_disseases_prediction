import os
import json
import uuid
from datetime import datetime
from threading import Lock

class DataStore:
    def __init__(self, data_dir=r"d:\CropDiseaseProject\backend\data"):
        self.data_dir = data_dir
        os.makedirs(self.data_dir, exist_ok=True)
        self.reports_file = os.path.join(self.data_dir, "reports.json")
        self.sensors_file = os.path.join(self.data_dir, "sensors.json")
        self.lock = Lock()
        
        # Initialize files with empty arrays if they don't exist
        self._init_file(self.reports_file, [])
        self._init_file(self.sensors_file, [])
        
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

    def _seed_default_data(self):
        reports = self.get_all_reports()
        if len(reports) == 0:
            # Seed 5 mock reports around Punjab/Haryana area (latitude 29.0 - 31.0, longitude 75.0 - 77.0)
            mock_reports = [
                {
                    "id": "mock-report-1",
                    "timestamp": "2026-08-23T10:30:00Z",
                    "crop": "Tomato",
                    "disease": "Tomato___Early_blight",
                    "severity": "Medium",
                    "status": "Expert Verified",
                    "latitude": 29.9680,
                    "longitude": 76.8180,
                    "image_url": "/api/static-images/tomato_early_blight.jpg",
                    "confidence": 88.5,
                    "farmer_notes": "Spotting on lower leaves of my tomato patch.",
                    "expert_notes": "Early blight confirmed. Recommended Mancozeb treatment."
                },
                {
                    "id": "mock-report-2",
                    "timestamp": "2026-08-24T08:15:00Z",
                    "crop": "Potato",
                    "disease": "Potato___Late_blight",
                    "severity": "High",
                    "status": "Unverified",
                    "latitude": 30.3782,
                    "longitude": 76.7767,
                    "image_url": "/api/static-images/potato_late_blight.jpg",
                    "confidence": 92.1,
                    "farmer_notes": "Fuzzy white mold on leaf underside, spreading very fast after rains.",
                    "expert_notes": ""
                },
                {
                    "id": "mock-report-3",
                    "timestamp": "2026-08-24T14:45:00Z",
                    "crop": "Corn (maize)",
                    "disease": "Corn_(maize)___Common_rust_",
                    "severity": "Low",
                    "status": "Expert Verified",
                    "latitude": 29.6857,
                    "longitude": 76.9905,
                    "image_url": "/api/static-images/corn_common_rust.jpg",
                    "confidence": 79.4,
                    "farmer_notes": "Brown powdery spots on some leaves.",
                    "expert_notes": "Common rust confirmed. Minor infection. Advised crop spacing."
                },
                {
                    "id": "mock-report-4",
                    "timestamp": "2026-08-25T09:00:00Z",
                    "crop": "Apple",
                    "disease": "Apple___Apple_scab",
                    "severity": "High",
                    "status": "Unverified",
                    "latitude": 31.1048,
                    "longitude": 77.1734,
                    "image_url": "/api/static-images/apple_scab.jpg",
                    "confidence": 91.0,
                    "farmer_notes": "Velvety black spots on the leaves.",
                    "expert_notes": ""
                },
                {
                    "id": "mock-report-5",
                    "timestamp": "2026-08-25T11:20:00Z",
                    "crop": "Pepper, bell",
                    "disease": "Pepper,_bell___Bacterial_spot",
                    "severity": "Medium",
                    "status": "Rejected",
                    "latitude": 30.1364,
                    "longitude": 77.2919,
                    "image_url": "/api/static-images/pepper_bacterial_spot.jpg",
                    "confidence": 65.2,
                    "farmer_notes": "Leaf curl on peppers.",
                    "expert_notes": "Rejected. This is nutrient deficiency leaf curl, not bacterial spot. Apply calcium."
                }
            ]
            self._write_json(self.reports_file, mock_reports)
            
        logs = self.get_all_sensor_logs()
        if len(logs) == 0:
            mock_logs = [
                {
                    "id": "mock-log-1",
                    "timestamp": "2026-08-24T18:00:00Z",
                    "temperature": 24.5,
                    "humidity": 85.0,
                    "soil_moisture": 52.0,
                    "pest_count": 12,
                    "notes": "Pheromone trap checked. Pests captured: 12 armyworms."
                },
                {
                    "id": "mock-log-2",
                    "timestamp": "2026-08-25T06:00:00Z",
                    "temperature": 22.0,
                    "humidity": 90.0,
                    "soil_moisture": 50.0,
                    "pest_count": 8,
                    "notes": "Morning check."
                },
                {
                    "id": "mock-log-3",
                    "timestamp": "2026-08-25T12:00:00Z",
                    "temperature": 29.5,
                    "humidity": 72.0,
                    "soil_moisture": 46.0,
                    "pest_count": 5,
                    "notes": "Pest counts down during mid-day."
                }
            ]
            self._write_json(self.sensors_file, mock_logs)
