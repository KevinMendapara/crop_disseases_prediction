import os
import sys
import json
import random

# Add backend directory to sys.path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
sys.path.insert(0, backend_dir)

from model_helper import ModelHelper

def run_prediction(image_path=None):
    print("=" * 60)
    print("      AgroShield AI - Crop Disease Prediction Model")
    print("=" * 60)
    
    # Initialize ModelHelper
    print("\n[1/3] Loading model and class definitions...")
    helper = ModelHelper(backend_dir=backend_dir)
    
    if not helper.model:
        print("[ERROR] Model file 'crop_disease_model.keras' could not be loaded.")
        return

    # Load recommendations
    recs_path = os.path.join(backend_dir, "recommendations.json")
    recs = {}
    if os.path.exists(recs_path):
        with open(recs_path, "r") as f:
            recs = json.load(f)

    # Select image
    if image_path is None or not os.path.exists(image_path):
        if image_path:
            print(f"[!] File not found: {image_path}. Choosing a sample image from dataset...")
        
        # Search for a sample image in rice_leaf_diseases or dataset
        samples = []
        rice_dir = os.path.join(os.path.dirname(__file__), "rice_leaf_diseases")
        pv_val_dir = os.path.join(os.path.dirname(__file__), "dataset", "PlantVillage", "val")
        
        for search_dir in [rice_dir, pv_val_dir]:
            if os.path.exists(search_dir):
                for root, _, files in os.walk(search_dir):
                    for file in files:
                        if file.lower().endswith((".jpg", ".jpeg", ".png")):
                            samples.append(os.path.join(root, file))
        
        if not samples:
            print("[ERROR] No sample images found in dataset directories.")
            return
            
        image_path = random.choice(samples)
    
    print(f"\n[2/3] Input Leaf Image: {image_path}")
    
    # Check if image is leaf
    with open(image_path, "rb") as f:
        is_leaf, leaf_msg = helper.check_is_leaf(f)
        print(f"  -> Leaf Validation: {'Passed' if is_leaf else 'Warning: ' + leaf_msg}")
        
        f.seek(0)
        predicted_class, confidence = helper.predict_image(f)
        
    print(f"\n[3/3] Prediction Results:")
    print(f"  -> Raw Class:      {predicted_class}")
    print(f"  -> Confidence:     {confidence:.2f}%")
    
    parts = predicted_class.split("___")
    crop = parts[0].replace("_", " ") if len(parts) > 0 else "Unknown"
    disease = parts[1].replace("_", " ") if len(parts) > 1 else "Healthy"
    print(f"  -> Crop:           {crop}")
    print(f"  -> Disease/Status: {disease}")
    
    if predicted_class in recs:
        r = recs[predicted_class]
        print(f"\n  [Advisory & Management Guide]")
        print(f"  - Scientific Name:     {r.get('scientific_name')}")
        print(f"  - Symptoms:            {r.get('symptoms')}")
        print(f"  - Biological Control:  {r.get('biological_control')}")
        print(f"  - Chemical Control:    {r.get('chemical_control')}")
        print(f"  - Recommended Dosage:  {r.get('dosage')}")
        print(f"  - Monitoring Interval: {r.get('monitoring_interval')}")
    print("=" * 60)

if __name__ == "__main__":
    img_arg = sys.argv[1] if len(sys.argv) > 1 else None
    run_prediction(img_arg)
