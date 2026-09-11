import os
import requests
import time
import io
from PIL import Image

def run_tests():
    base_url = "http://localhost:5000"
    
    print("Waiting for Flask server to be ready...")
    # Wait up to 5 seconds
    server_ready = False
    for i in range(10):
        try:
            r = requests.get(base_url)
            if r.status_code == 200:
                server_ready = True
                break
        except Exception:
            pass
        time.sleep(0.5)
        
    if not server_ready:
        print("Error: Flask server is not running on port 5000.")
        return False
        
    print("Flask server detected. Running verification tests...")
    
    # 1. Test /api/reports GET
    print("\n[Test 1] GET /api/reports")
    try:
        r = requests.get(f"{base_url}/api/reports")
        print(f"Status: {r.status_code}")
        assert r.status_code == 200
        reports = r.json()
        crop_text = reports[0]['crop'] if reports else "None (empty queue)"
        print(f"Loaded {len(reports)} reports. First report crop: {crop_text}")
    except Exception as e:
        print(f"FAIL: {e}")
        return False
        
    # 2. Test /api/weather-forecast GET
    print("\n[Test 2] GET /api/weather-forecast")
    try:
        r = requests.get(f"{base_url}/api/weather-forecast")
        print(f"Status: {r.status_code}")
        assert r.status_code == 200
        data = r.json()
        print(f"Simulated weather: {data['temperature']}C, {data['humidity']}% humidity.")
        print(f"Computed Late Blight Risk: {data['risks']['Late Blight (Potato/Tomato)']['level']}")
    except Exception as e:
        print(f"FAIL: {e}")
        return False

    # 3. Test /api/dashboard-stats GET
    print("\n[Test 3] GET /api/dashboard-stats")
    try:
        r = requests.get(f"{base_url}/api/dashboard-stats")
        print(f"Status: {r.status_code}")
        assert r.status_code == 200
        data = r.json()
        print(f"Dashboard Stats -> Total Outbreaks: {data['total_outbreaks']}, Pending: {data['pending_validation']}")
    except Exception as e:
        print(f"FAIL: {e}")
        return False

    # 4. Test /api/sensor-logs POST & GET
    print("\n[Test 4] POST /api/sensor-logs")
    try:
        log_payload = {
            "temperature": 27.5,
            "humidity": 68.0,
            "soil_moisture": 40.0,
            "pest_count": 15,
            "notes": "Verification test reading"
        }
        r = requests.post(f"{base_url}/api/sensor-logs", json=log_payload)
        print(f"Status: {r.status_code}")
        assert r.status_code == 201
        created_log = r.json()
        print(f"Logged sensor ID: {created_log['id']}, Pest Count: {created_log['pest_count']}")
    except Exception as e:
        print(f"FAIL: {e}")
        return False

    # 5. Test /api/predict with dummy image
    print("\n[Test 5] POST /api/predict (Inference & Logging)")
    try:
        # Create a dummy image file in-memory
        img = Image.new("RGB", (128, 128), color="green")
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='JPEG')
        img_byte_arr.seek(0)
        
        files = {
            "image": ("test_leaf.jpg", img_byte_arr, "image/jpeg")
        }
        data = {
            "latitude": "29.9680",
            "longitude": "76.8180",
            "farmer_notes": "Verification test leaf diagnostic"
        }
        r = requests.post(f"{base_url}/api/predict", files=files, data=data)
        print(f"Status: {r.status_code}")
        assert r.status_code == 200
        res = r.json()
        print(f"AI Prediction: {res['prediction']} (Confidence: {res['confidence']:.1f}%)")
        print(f"Crop: {res['crop']}, Disease: {res['disease_label']}, Severity: {res['severity']}")
        print(f"Advisory Scientific Name: {res['advisory']['scientific_name']}")
        assert "gradcam_image" in res
        print(f"Explainable AI: Grad-CAM Saliency generated: {bool(res.get('gradcam_image'))}")
    except Exception as e:
        print(f"FAIL: {e}")
        return False

    # 6. Test /api/predict with non-leaf image (Non-leaf rejection)
    print("\n[Test 6] POST /api/predict (Non-leaf rejection)")
    try:
        # Create a dummy solid red image which triggers ImageNet 'envelope' classification
        img = Image.new("RGB", (224, 224), color="red")
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='JPEG')
        img_byte_arr.seek(0)
        
        files = {
            "image": ("test_non_leaf.jpg", img_byte_arr, "image/jpeg")
        }
        data = {
            "latitude": "29.9680",
            "longitude": "76.8180",
            "farmer_notes": "Verification test non-leaf diagnostic"
        }
        r = requests.post(f"{base_url}/api/predict", files=files, data=data)
        print(f"Status: {r.status_code}")
        assert r.status_code == 400
        res = r.json()
        print(f"Rejection Message: {res['error']}")
        assert "Not a leaf" in res['error']
    except Exception as e:
        print(f"FAIL: {e}")
        return False

    # 7. Test /api/auth/register and /api/auth/login
    print("\n[Test 7] POST /api/auth/register & /api/auth/login")
    try:
        test_email = f"test_farmer_{int(time.time())}@agroshield.org"
        reg_payload = {
            "email": test_email,
            "password": "securepassword123",
            "full_name": "Test Farmer",
            "village": "Green Field",
            "district": "Faridabad"
        }
        r = requests.post(f"{base_url}/api/auth/register", json=reg_payload)
        print(f"Register Status: {r.status_code}")
        assert r.status_code == 201
        reg_data = r.json()
        assert reg_data.get("success") is True
        print(f"Registered User: {reg_data['user']['full_name']} ({reg_data['user']['email']})")

        login_payload = {
            "email": test_email,
            "password": "securepassword123"
        }
        r2 = requests.post(f"{base_url}/api/auth/login", json=login_payload)
        print(f"Login Status: {r2.status_code}")
        assert r2.status_code == 200
        login_data = r2.json()
        assert login_data.get("success") is True
        print(f"Authenticated User: {login_data['user']['full_name']}")
    except Exception as e:
        print(f"FAIL: {e}")
        return False

    # 8. Test /api/proximity-alerts
    print("\n[Test 8] GET /api/proximity-alerts (Outbreak Early Warning)")
    try:
        r = requests.get(f"{base_url}/api/proximity-alerts?latitude=29.9680&longitude=76.8180&radius_km=25")
        print(f"Status: {r.status_code}")
        assert r.status_code == 200
        alert_data = r.json()
        print(f"Outbreak Detected: {alert_data['outbreak_detected']}")
        print(f"Nearby Outbreaks: {alert_data['nearby_count']} within {alert_data['radius_km']}km")
        print(f"Dominant Disease: {alert_data['dominant_disease']} (Closest: {alert_data['closest_distance_km']}km)")
        print(f"Precaution: {alert_data['recommended_precaution']}")
    except Exception as e:
        print(f"FAIL: {e}")
        return False

    # 9. Test /api/kvk-locator
    print("\n[Test 9] GET /api/kvk-locator (Krishi Vigyan Kendra Referral)")
    try:
        r = requests.get(f"{base_url}/api/kvk-locator?latitude=29.9680&longitude=76.8180")
        print(f"Status: {r.status_code}")
        assert r.status_code == 200
        kvk_data = r.json()
        nearest = kvk_data["nearest_kvk"]
        print(f"Nearest KVK Hub: {nearest['name']} ({nearest['district']}, {nearest['state']})")
        print(f"Distance: {nearest['distance_km']} km | Phone: {nearest['phone']}")
        print(f"Scientist: {nearest['senior_scientist']}")
    except Exception as e:
        print(f"FAIL: {e}")
        return False

    print("\nALL 9 BACKEND VERIFICATION TESTS PASSED SUCCESSFULLY!")
    return True

if __name__ == "__main__":
    run_tests()

