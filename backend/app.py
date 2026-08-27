import os
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

from data_store import DataStore
from model_helper import ModelHelper

app = Flask(__name__, static_folder="../frontend", static_url_path="")
CORS(app)

# Initialize components
data_store = DataStore()
model_helper = ModelHelper()

# Load recommendations
recs_path = r"d:\CropDiseaseProject\backend\recommendations.json"
try:
    with open(recs_path, "r") as f:
        recommendations = json.load(f)
except Exception as e:
    print(f"Error loading recommendations: {e}")
    recommendations = {}

@app.route("/")
def serve_index():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/api/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400
        
    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400
        
    # Get location parameters if sent
    latitude = request.form.get("latitude", 29.5)
    longitude = request.form.get("longitude", 76.5)
    farmer_notes = request.form.get("farmer_notes", "")
    
    # Check if the uploaded image is a leaf/plant
    try:
        is_leaf, leaf_msg = model_helper.check_is_leaf(file)
        if not is_leaf:
            return jsonify({"error": leaf_msg}), 400
    except Exception as e:
        print(f"Leaf check error: {e}")
        
    # Save file temporarily or predict directly
    try:
        predicted_class, confidence = model_helper.predict_image(file)
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500
        
    # Get recommendations
    rec_detail = recommendations.get(predicted_class, {
        "scientific_name": "Unknown Pathogen",
        "disease": predicted_class.replace("___", " - ").replace("_", " "),
        "description": "No detailed metadata is currently available for this plant disease.",
        "symptoms": "Visible leaf anomalies.",
        "prevention": "Implement standard crop hygiene.",
        "biological_control": "Refer to local extension office.",
        "chemical_control": "Apply broad-spectrum copper fungicide if needed.",
        "dosage": "Refer to package instructions.",
        "monitoring_interval": "Inspect every 7 days."
    })
    
    # Parse crop and disease labels for logging
    parts = predicted_class.split("___")
    crop = parts[0].replace("_", " ") if len(parts) > 0 else "Unknown"
    disease = parts[1].replace("_", " ") if len(parts) > 1 else "Healthy"
    
    # Determine severity
    severity = "Medium"
    if "late_blight" in predicted_class.lower() or "greening" in predicted_class.lower() or "scab" in predicted_class.lower():
        severity = "High"
    elif "healthy" in predicted_class.lower():
        severity = "Low"
        
    # Log report automatically
    # Save uploaded image under data folder to simulate persistent link
    reports_img_dir = os.path.join(data_store.data_dir, "uploaded_images")
    os.makedirs(reports_img_dir, exist_ok=True)
    
    img_filename = f"pred_{os.urandom(4).hex()}.jpg"
    img_save_path = os.path.join(reports_img_dir, img_filename)
    
    try:
        file.seek(0)
        with Image.open(file) as img:
            img.save(img_save_path, "JPEG")
        image_url = f"/api/uploaded-images/{img_filename}"
    except Exception as e:
        print(f"Error saving image: {e}")
        image_url = ""
        
    report = data_store.add_report({
        "crop": crop,
        "disease": predicted_class,
        "severity": severity,
        "status": "Unverified",
        "latitude": latitude,
        "longitude": longitude,
        "image_url": image_url,
        "confidence": confidence,
        "farmer_notes": farmer_notes
    })
    
    return jsonify({
        "prediction": predicted_class,
        "confidence": confidence,
        "crop": crop,
        "disease_label": disease,
        "severity": severity,
        "advisory": rec_detail,
        "report_id": report["id"]
    })

@app.route("/api/reports", methods=["GET", "POST"])
def handle_reports():
    if request.method == "GET":
        reports = data_store.get_all_reports()
        return jsonify(reports)
        
    elif request.method == "POST":
        data = request.json or {}
        report = data_store.add_report(data)
        return jsonify(report), 201

@app.route("/api/reports/<report_id>/validate", methods=["POST"])
def validate_report(report_id):
    data = request.json or {}
    status = data.get("status")
    expert_notes = data.get("expert_notes", "")
    corrected_disease = data.get("corrected_disease", None)
    
    if status not in ["Expert Verified", "Rejected"]:
        return jsonify({"error": "Invalid status"}), 400
        
    updated = data_store.update_report_status(report_id, status, expert_notes, corrected_disease)
    if not updated:
        return jsonify({"error": "Report not found"}), 404
        
    return jsonify(updated)

@app.route("/api/sensor-logs", methods=["GET", "POST"])
def handle_sensor_logs():
    if request.method == "GET":
        logs = data_store.get_all_sensor_logs()
        return jsonify(logs)
    elif request.method == "POST":
        data = request.json or {}
        log = data_store.add_sensor_log(data)
        return jsonify(log), 201

@app.route("/api/weather-forecast", methods=["GET"])
def get_weather_forecast():
    # Simulated current metrics
    temp = 19.5  # Cool weather
    humidity = 87.0  # Very humid/wet
    soil_moist = 54.0  # Moist
    
    # Compute risks
    # Late Blight: favored by cool wet weather (humidity > 80, temp 10-22)
    late_blight_risk = "High" if (humidity > 80 and 10 <= temp <= 22) else "Medium"
    
    # Apple Scab: favored by warm wet weather (humidity > 75, temp 15-25)
    apple_scab_risk = "High" if (humidity > 75 and 15 <= temp <= 25) else "Medium"
    
    # Rust: favored by moderate temp, humid weather
    rust_risk = "Medium" if (humidity > 70 and 18 <= temp <= 28) else "Low"
    
    # Pest outbreak: favored by warm dry weather, but let's base it on recent traps
    logs = data_store.get_all_sensor_logs()
    pest_count_avg = np.mean([log["pest_count"] for log in logs[-5:]]) if logs else 0
    pest_risk = "High" if pest_count_avg > 10 else ("Medium" if pest_count_avg > 5 else "Low")
    
    # 7-Day projections (Simulating weather transition from wet/cool to warm/dry)
    projections = {
        "labels": ["Today", "Tomorrow", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"],
        "late_blight": [85, 92, 95, 65, 35, 15, 10],
        "apple_scab": [70, 82, 88, 72, 45, 25, 15],
        "pest_outbreak": [30, 35, 40, 55, 70, 85, 90]
    }
    
    return jsonify({
        "temperature": temp,
        "humidity": humidity,
        "soil_moisture": soil_moist,
        "wind_speed": 12.4, # km/h
        "forecast": "Cloudy with light showers expected.",
        "risks": {
            "Late Blight (Potato/Tomato)": {
                "level": late_blight_risk,
                "factor": "High humidity combined with cool 19°C temperatures creates optimal leaf-wetness duration."
            },
            "Apple Scab": {
                "level": apple_scab_risk,
                "factor": "Frequent rain showers keep foliage wet. Protect orchard early."
            },
            "Common Rust (Corn)": {
                "level": rust_risk,
                "factor": "Moderate temperatures support rust spore germination."
            },
            "Pest Infestation": {
                "level": pest_risk,
                "factor": f"Current trap average is {pest_count_avg:.1f} pests/trap. Threshold alert if > 10."
            }
        },
        "projections": projections
    })

@app.route("/api/geological-conditions", methods=["GET"])
def get_geological_conditions():
    latitude = request.args.get("latitude")
    longitude = request.args.get("longitude")
    if not latitude or not longitude:
        return jsonify({"error": "Latitude and longitude query parameters are required"}), 400
    try:
        conditions = model_helper.get_geological_conditions(latitude, longitude)
        return jsonify(conditions)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/login", methods=["POST"])
def admin_login():
    data = request.json or {}
    email = data.get("email")
    password = data.get("password")
    
    # Read from environment variables or secure defaults
    admin_email = os.environ.get("ADMIN_EMAIL", "officer@agroshield.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "officer2026")
    
    if email == admin_email and password == admin_password:
        return jsonify({"success": True, "role": "admin"})
    else:
        return jsonify({"success": False, "message": "Invalid email or password"}), 401

@app.route("/api/dashboard-stats", methods=["GET"])
def get_dashboard_stats():
    reports = data_store.get_all_reports()
    logs = data_store.get_all_sensor_logs()
    
    total_outbreaks = len(reports)
    pending_validation = sum(1 for r in reports if r["status"] == "Unverified")
    high_severity = sum(1 for r in reports if r["severity"] == "High")
    
    # Crop counts
    crop_counts = {}
    disease_counts = {}
    for r in reports:
        crop_counts[r["crop"]] = crop_counts.get(r["crop"], 0) + 1
        disease_counts[r["disease"]] = disease_counts.get(r["disease"], 0) + 1
        
    # Historical monthly trend (simulate past 6 months)
    monthly_trend = {
        "labels": ["March", "April", "May", "June", "July", "August"],
        "values": [4, 7, 12, 18, 25, total_outbreaks]
    }
    
    return jsonify({
        "total_outbreaks": total_outbreaks,
        "pending_validation": pending_validation,
        "high_severity": high_severity,
        "crop_distribution": crop_counts,
        "disease_distribution": disease_counts,
        "monthly_trend": monthly_trend,
        "recent_sensor": logs[-1] if logs else None
    })

# Serve user uploaded images
@app.route("/api/uploaded-images/<filename>")
def serve_uploaded_image(filename):
    uploaded_dir = os.path.join(data_store.data_dir, "uploaded_images")
    return send_from_directory(uploaded_dir, filename)

# Serve static mock images dynamically if they don't exist
@app.route("/api/static-images/<filename>")
def serve_static_image(filename):
    static_images_dir = os.path.join(data_store.data_dir, "static_images")
    os.makedirs(static_images_dir, exist_ok=True)
    filepath = os.path.join(static_images_dir, filename)
    
    if not os.path.exists(filepath):
        # Generate a placeholder leaf graphic using Pillow
        img = Image.new("RGB", (300, 300), color=(30, 70, 50)) # deep green background
        draw = ImageDraw.Draw(img)
        
        # Draw a stylized leaf
        draw.ellipse([50, 80, 250, 220], fill=(16, 185, 129), outline=(10, 100, 60), width=4)
        # Leaf veins
        draw.line([50, 150, 250, 150], fill=(6, 95, 70), width=3)
        draw.line([100, 150, 130, 100], fill=(6, 95, 70), width=2)
        draw.line([100, 150, 130, 200], fill=(6, 95, 70), width=2)
        draw.line([150, 150, 180, 100], fill=(6, 95, 70), width=2)
        draw.line([150, 150, 180, 200], fill=(6, 95, 70), width=2)
        
        # Add text label based on filename
        label = filename.replace(".jpg", "").replace("_", " ").title()
        draw.text((20, 250), label, fill=(255, 255, 255))
        
        img.save(filepath, "JPEG")
        
    return send_from_directory(static_images_dir, filename)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)

