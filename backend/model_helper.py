import os
import json
import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

class ModelHelper:
    def __init__(self, backend_dir=r"d:\CropDiseaseProject\backend"):
        self.backend_dir = backend_dir
        self.model_path = os.path.join(self.backend_dir, "crop_disease_model.keras")
        self.class_names_path = os.path.join(self.backend_dir, "class_names.json")
        
        self.model = None
        self.class_names = []
        
        self.load_model_and_classes()

    def load_model_and_classes(self):
        if os.path.exists(self.class_names_path):
            try:
                with open(self.class_names_path, "r") as f:
                    self.class_names = json.load(f)
                print(f"Loaded {len(self.class_names)} class names.")
            except Exception as e:
                print(f"Error loading class names: {e}")
        else:
            print("Class names file not found.")

        if os.path.exists(self.model_path):
            try:
                # Load Keras model
                self.model = tf.keras.models.load_model(self.model_path)
                print("TensorFlow model loaded successfully.")
            except Exception as e:
                print(f"Error loading TensorFlow model: {e}")
        else:
            print("Model file not found. Inference will not work until training completes.")

    def check_is_leaf(self, file_stream):
        if not hasattr(self, "imagenet_model") or self.imagenet_model is None:
            # Lazy load MobileNetV2 with ImageNet weights
            self.imagenet_model = tf.keras.applications.MobileNetV2(weights="imagenet")
            
        try:
            file_stream.seek(0)
            img = Image.open(file_stream)
            img = img.convert("RGB")
            img = img.resize((224, 224))
            
            arr = np.array(img, dtype=np.float32)
            arr = preprocess_input(arr)
            batch = np.expand_dims(arr, axis=0)
            
            preds = self.imagenet_model.predict(batch, verbose=0)
            decoded = tf.keras.applications.mobilenet_v2.decode_predictions(preds, top=5)[0]
            
            plant_keywords = {"leaf", "foliage", "plant", "tree", "flower", "vegetable", "fruit", 
                              "cabbage", "broccoli", "cauliflower", "zucchini", "squash", "cucumber", 
                              "pepper", "chili", "mushroom", "fungus", "corn", "maize", "banana", 
                              "orange", "lemon", "pomegranate", "pineapple", "apple", "strawberry", 
                              "peach", "fig", "grape", "pot", "flowerpot", "greenhouse", "acorn", "buckeye",
                              "sprout", "wood", "forest", "cardoon", "artichoke", "herb", "shrub", "daisy",
                              "head_cabbage", "buckeye", "acorn_squash", "butternut_squash"}
            
            # Check if any top 5 prediction matches plant keywords with at least 3% probability
            is_plant = False
            matched_label = ""
            for class_id, label, prob in decoded:
                label_lower = label.lower()
                if prob >= 0.03 and any(kw in label_lower for kw in plant_keywords):
                    is_plant = True
                    matched_label = label
                    break
            
            if is_plant:
                return True, f"Matched plant keyword: {matched_label}"
            
            # If not explicitly matched as a plant/leaf, reject it!
            top_label = decoded[0][1].replace('_', ' ')
            return False, f"Not a leaf/plant image (Identified as {top_label} with high probability)"
        except Exception as e:
            print(f"Error checking if image is leaf: {e}")
            return True, "Passed validation by default due to error"

    def predict_image(self, file_stream):
        if not self.model or not self.class_names:
            # Reload in case it was created in the meantime
            self.load_model_and_classes()
            if not self.model:
                return "Unknown", 0.0
        
        try:
            # Load and preprocess image
            file_stream.seek(0)
            img = Image.open(file_stream)
            img = img.convert('RGB')
            img = img.resize((128, 128))
            
            arr = np.array(img, dtype=np.float32)
            arr = preprocess_input(arr)
            batch = np.expand_dims(arr, axis=0)
            
            # Predict
            predictions = self.model.predict(batch)
            class_idx = int(np.argmax(predictions[0]))
            confidence = float(predictions[0][class_idx]) * 100.0
            
            predicted_class = self.class_names[class_idx]
            return predicted_class, confidence
        except Exception as e:
            print(f"Error in prediction: {e}")
            return "Unknown", 0.0

