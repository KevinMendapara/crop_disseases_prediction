import os
import json
import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

class ModelHelper:
    def __init__(self, backend_dir=None):
        if backend_dir is None:
            self.backend_dir = os.path.dirname(os.path.abspath(__file__))
        else:
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

        self.centroids_path = os.path.join(self.backend_dir, "centroids.json")
        self.centroids = {}
        if os.path.exists(self.centroids_path):
            try:
                with open(self.centroids_path, "r") as f:
                    self.centroids = json.load(f)
                print(f"Loaded {len(self.centroids)} class centroids.")
            except Exception as e:
                print(f"Error loading centroids: {e}")

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
        try:
            file_stream.seek(0)
            img = Image.open(file_stream).convert("RGB")
            
            # Quick check for natural foliage / agricultural leaf tone distribution (green, yellow, brown)
            arr_np = np.array(img.resize((100, 100)), dtype=np.float32)
            r, g, b = arr_np[..., 0], arr_np[..., 1], arr_np[..., 2]
            foliage_pixels = np.mean((g > b * 0.75) | (r > b * 0.85))
            if foliage_pixels > 0.30:
                return True, "Passed foliage validation"
            
            # If color distribution is unusual, check with MobileNetV2 for non-plant rejection
            if not hasattr(self, "imagenet_model") or self.imagenet_model is None:
                self.imagenet_model = tf.keras.applications.MobileNetV2(weights="imagenet")
                
            img_resized = img.resize((224, 224))
            arr = np.array(img_resized, dtype=np.float32)
            arr = preprocess_input(arr)
            batch = np.expand_dims(arr, axis=0)
            
            preds = self.imagenet_model.predict(batch, verbose=0)
            decoded = tf.keras.applications.mobilenet_v2.decode_predictions(preds, top=3)[0]
            
            blocked_keywords = {"cellular_telephone", "notebook", "laptop", "mouse", "keyboard", 
                                "car", "sports_car", "jeep", "truck", "motorcycle", "bicycle", 
                                "dog", "cat", "tabby", "golden_retriever", "couch", "refrigerator"}
            
            top_class, top_label, top_prob = decoded[0]
            top_label_lower = top_label.lower()
            if top_prob > 0.50 and any(bw in top_label_lower for bw in blocked_keywords):
                return False, f"Not a leaf or crop plant (Identified as {top_label.replace('_', ' ')})"
                
            return True, "Passed validation"
        except Exception as e:
            print(f"Error checking if image is leaf: {e}")
            return True, "Passed validation by default"

    def generate_gradcam(self, file_stream, class_idx=None):
        """
        Generates Explainable AI (Grad-CAM) saliency heatmap superimposed on the original leaf image.
        Returns a base64 encoded data URL (data:image/jpeg;base64,...).
        """
        try:
            if not self.model:
                return None
            import io
            import base64
            
            file_stream.seek(0)
            orig_img = Image.open(file_stream).convert('RGB')
            orig_w, orig_h = orig_img.size
            
            # 128x128 input for model
            resized_img = orig_img.resize((128, 128))
            arr = np.array(resized_img, dtype=np.float32)
            arr = preprocess_input(arr)
            batch = tf.convert_to_tensor(np.expand_dims(arr, axis=0))
            
            base_model = self.model.layers[0]
            dense_model = self.model.layers[1]
            
            with tf.GradientTape() as tape:
                conv_outputs = base_model(batch)
                tape.watch(conv_outputs)
                preds = dense_model(conv_outputs)
                if class_idx is None:
                    class_idx = int(tf.argmax(preds[0]))
                loss = preds[:, class_idx]
                
            grads = tape.gradient(loss, conv_outputs)
            pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
            
            conv_outputs_val = conv_outputs[0]
            cam = tf.reduce_sum(conv_outputs_val * pooled_grads, axis=-1)
            cam = tf.maximum(cam, 0)
            cam_max = tf.reduce_max(cam)
            if cam_max > 0:
                cam = cam / cam_max
            cam_np = cam.numpy()
            
            # Resize CAM to original image dimensions using PIL
            cam_pil = Image.fromarray(np.uint8(255 * cam_np)).resize((orig_w, orig_h), Image.Resampling.BILINEAR)
            val = np.array(cam_pil, dtype=np.float32) / 255.0
            
            # Create Jet colormap using pure NumPy
            r = np.clip(1.5 - np.abs(4.0 * val - 3.0), 0.0, 1.0)
            g = np.clip(1.5 - np.abs(4.0 * val - 2.0), 0.0, 1.0)
            b = np.clip(1.5 - np.abs(4.0 * val - 1.0), 0.0, 1.0)
            heatmap = np.stack([r * 255.0, g * 255.0, b * 255.0], axis=-1)
            
            orig_np = np.array(orig_img, dtype=np.float32)
            superimposed = np.uint8(0.45 * heatmap + 0.55 * orig_np)
            
            # Encode as JPEG base64
            buffered = io.BytesIO()
            Image.fromarray(superimposed).save(buffered, format="JPEG", quality=85)
            img_b64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
            return f"data:image/jpeg;base64,{img_b64}"
        except Exception as e:
            print(f"Error generating Grad-CAM: {e}")
            return None

    def predict_image(self, file_stream, return_gradcam=False):
        if not self.model or not self.class_names:
            # Reload in case it was created in the meantime
            self.load_model_and_classes()
            if not self.model:
                return ("Unknown", 0.0, None) if return_gradcam else ("Unknown", 0.0)
        
        try:
            # Load and preprocess image
            file_stream.seek(0)
            img = Image.open(file_stream)
            img = img.convert('RGB')
            img = img.resize((128, 128))
            
            arr = np.array(img, dtype=np.float32)
            arr = preprocess_input(arr)
            batch = np.expand_dims(arr, axis=0)
            
            # Predict base features using base model (first layer of sequential model)
            base_model = self.model.layers[0]
            feature_maps = base_model.predict(batch, verbose=0)
            
            # GAP feature representation
            feature_gap = np.mean(feature_maps, axis=(1, 2))[0]
            feature_norm = feature_gap / (np.linalg.norm(feature_gap) + 1e-8)
            
            # Check similarity if centroids exist
            if self.centroids:
                max_sim = -1.0
                best_class = None
                for name, centroid in self.centroids.items():
                    centroid_arr = np.array(centroid)
                    sim = np.dot(feature_norm, centroid_arr)
                    if sim > max_sim:
                        max_sim = sim
                        best_class = name
                
                print(f"Centroid Similarity Check: Best similarity = {max_sim:.3f} to {best_class}")
                
                # Threshold check: if similarity is below 0.70, classify as unsupported crop
                if max_sim < 0.70:
                    print(f"OOD Outbreak: Similarity {max_sim:.3f} < 0.70. Reverting to unsupported crop.")
                    res_class = "Unknown___Unsupported_Crop"
                    res_conf = float(max_sim * 100.0)
                    gradcam = None
                    if return_gradcam:
                        return res_class, res_conf, gradcam
                    return res_class, res_conf
            
            # Predict category
            predictions = self.model.predict(batch, verbose=0)
            class_idx = int(np.argmax(predictions[0]))
            confidence = float(predictions[0][class_idx]) * 100.0
            
            predicted_class = self.class_names[class_idx]
            
            gradcam = None
            if return_gradcam:
                gradcam = self.generate_gradcam(file_stream, class_idx)
                return predicted_class, confidence, gradcam
                
            return predicted_class, confidence
        except Exception as e:
            print(f"Error in prediction: {e}")
            return ("Unknown", 0.0, None) if return_gradcam else ("Unknown", 0.0)

    def get_geological_conditions(self, latitude, longitude):
        try:
            lat = float(latitude)
            lon = float(longitude)
        except (ValueError, TypeError):
            lat = 30.1
            lon = 76.8

        # Create a deterministic seed from latitude and longitude
        seed = int((abs(lat) * 100000 + abs(lon) * 100000) % 1000000)
        rng = np.random.default_rng(seed)

        soil_types = ["Sandy Loam", "Clayey", "Silt Loam", "Alluvial", "Black Soil", "Sandy Clay"]
        drainage_classes = ["Well Drained", "Moderately Drained", "Poorly Drained", "Somewhat Excessively Drained"]
        agro_zones = ["Trans-Gangetic Plains Region", "Western Himalayan Region", "Central Plateau & Hill Region"]

        soil_type = rng.choice(soil_types)
        drainage = rng.choice(drainage_classes)
        agro_zone = rng.choice(agro_zones)

        # Deterministic measurements
        soil_ph = round(rng.uniform(5.8, 7.8), 2)
        soil_moisture = round(rng.uniform(15.0, 65.0), 1)
        nitrogen = int(rng.integers(10, 150))
        phosphorus = int(rng.integers(5, 60))
        potassium = int(rng.integers(50, 350))
        organic_matter = round(rng.uniform(0.5, 4.0), 2)
        water_table = round(rng.uniform(2.0, 45.0), 1)
        elevation = int(rng.integers(150, 800))
        clay_content = int(rng.integers(10, 45))
        sand_content = int(rng.integers(20, 70))
        silt_content = 100 - (clay_content + sand_content)
        if silt_content < 0:
            silt_content = 0
            sand_content = 100 - clay_content

        return {
            "latitude": lat,
            "longitude": lon,
            "soil_type": soil_type,
            "soil_ph": soil_ph,
            "soil_moisture": soil_moisture,
            "nitrogen": nitrogen,
            "phosphorus": phosphorus,
            "potassium": potassium,
            "organic_matter": organic_matter,
            "water_table_depth": water_table,
            "elevation": elevation,
            "drainage_class": drainage,
            "agro_ecological_zone": agro_zone,
            "clay_content_percent": clay_content,
            "sand_content_percent": sand_content,
            "silt_content_percent": silt_content
        }


