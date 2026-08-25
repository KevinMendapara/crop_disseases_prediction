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

    def predict_image(self, file_stream):
        if not self.model or not self.class_names:
            # Reload in case it was created in the meantime
            self.load_model_and_classes()
            if not self.model:
                return "Unknown", 0.0
        
        try:
            # Load and preprocess image
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
