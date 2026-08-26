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
        print(f"Loaded {len(reports)} reports. First report crop: {reports[0]['crop']}")
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

    print("\nALL BACKEND VERIFICATION TESTS PASSED SUCCESSFULLY!")
    return True

if __name__ == "__main__":
    run_tests()
