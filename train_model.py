import os
import json
import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

def load_merged_dataset(train_dir, val_dir, rice_dir, max_samples_per_class=150, target_size=(128, 128)):
    # 1. Load PlantVillage train classes
    pv_train_classes = sorted([d for d in os.listdir(train_dir) if os.path.isdir(os.path.join(train_dir, d))])
    
    # 2. Rice classes in rice_dir
    rice_raw_classes = sorted([d for d in os.listdir(rice_dir) if os.path.isdir(os.path.join(rice_dir, d))])
    # Map to Rice___<Class_Name>
    rice_mapped_classes = [f"Rice___{cls.replace(' ', '_')}" for cls in rice_raw_classes]
    
    # Merge and sort all classes
    all_classes = sorted(pv_train_classes + rice_mapped_classes)
    
    X_train, y_train = [], []
    X_val, y_val = [], []
    
    # Process each class
    for idx, cls in enumerate(all_classes):
        if cls.startswith("Rice___"):
            # Load from rice_leaf_diseases folder
            raw_name = cls.replace("Rice___", "").replace("_", " ")
            cls_path = os.path.join(rice_dir, raw_name)
            img_names = [f for f in os.listdir(cls_path) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
            
            # Shuffle and split 80/20
            np.random.seed(42)
            np.random.shuffle(img_names)
            split_idx = int(len(img_names) * 0.8)
            train_imgs = img_names[:split_idx]
            val_imgs = img_names[split_idx:]
            
            print(f"Loading Rice class: {cls} -> Train: {len(train_imgs)}, Val: {len(val_imgs)}")
            
            # Load train
            for img_name in train_imgs:
                img_path = os.path.join(cls_path, img_name)
                try:
                    with Image.open(img_path) as img:
                        img = img.convert('RGB').resize(target_size)
                        arr = np.array(img, dtype=np.float32)
                        arr = preprocess_input(arr)
                        X_train.append(arr)
                        y_train.append(idx)
                except Exception as e:
                    print(f"Error loading {img_path}: {e}")
                    
            # Load val
            for img_name in val_imgs:
                img_path = os.path.join(cls_path, img_name)
                try:
                    with Image.open(img_path) as img:
                        img = img.convert('RGB').resize(target_size)
                        arr = np.array(img, dtype=np.float32)
                        arr = preprocess_input(arr)
                        X_val.append(arr)
                        y_val.append(idx)
                except Exception as e:
                    print(f"Error loading {img_path}: {e}")
        else:
            # Load PlantVillage train
            train_cls_path = os.path.join(train_dir, cls)
            train_imgs = [f for f in os.listdir(train_cls_path) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
            train_imgs = train_imgs[:max_samples_per_class]
            
            print(f"Loading PlantVillage class: {cls} -> Train: {len(train_imgs)}")
            for img_name in train_imgs:
                img_path = os.path.join(train_cls_path, img_name)
                try:
                    with Image.open(img_path) as img:
                        img = img.convert('RGB').resize(target_size)
                        arr = np.array(img, dtype=np.float32)
                        arr = preprocess_input(arr)
                        X_train.append(arr)
                        y_train.append(idx)
                except Exception as e:
                    print(f"Error loading {img_path}: {e}")
            
            # Load PlantVillage val
            val_cls_path = os.path.join(val_dir, cls)
            val_imgs = [f for f in os.listdir(val_cls_path) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
            val_imgs = val_imgs[:max(1, int(max_samples_per_class * 0.2))]
            
            for img_name in val_imgs:
                img_path = os.path.join(val_cls_path, img_name)
                try:
                    with Image.open(img_path) as img:
                        img = img.convert('RGB').resize(target_size)
                        arr = np.array(img, dtype=np.float32)
                        arr = preprocess_input(arr)
                        X_val.append(arr)
                        y_val.append(idx)
                except Exception as e:
                    print(f"Error loading {img_path}: {e}")
                    
    return np.array(X_train), np.array(y_train), np.array(X_val), np.array(y_val), all_classes

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Train AgroShield Crop Disease Model")
    parser.add_argument("--samples", type=int, default=150, help="Max samples per class")
    parser.add_argument("--epochs", type=int, default=15, help="Training epochs")
    args = parser.parse_args()

    train_dir = r"d:\CropDiseaseProject\dataset\PlantVillage\train"
    val_dir = r"d:\CropDiseaseProject\dataset\PlantVillage\val"
    rice_dir = r"d:\CropDiseaseProject\rice_leaf_diseases"
    backend_dir = r"d:\CropDiseaseProject\backend"
    
    os.makedirs(backend_dir, exist_ok=True)
    
    print(f"Loading merged dataset (PlantVillage + Rice Leaf Diseases) with max {args.samples} samples/class...")
    X_train, y_train, X_val, y_val, all_classes = load_merged_dataset(train_dir, val_dir, rice_dir, max_samples_per_class=args.samples)
    
    num_classes = len(all_classes)
    print(f"Dataset loaded. Total classes: {num_classes}")
    print(f"X_train shape: {X_train.shape}, X_val shape: {X_val.shape}")
    
    # Save class names mapping
    class_map_path = os.path.join(backend_dir, "class_names.json")
    with open(class_map_path, "w") as f:
        json.dump(all_classes, f, indent=4)
    print(f"Class names saved to {class_map_path}")
    
    # Build base model
    print("Building MobileNetV2 base model...")
    base_model = tf.keras.applications.MobileNetV2(
        input_shape=(128, 128, 3),
        include_top=False,
        weights='imagenet'
    )
    base_model.trainable = False  # Freeze base weights
    
    # Pre-compute features (Feature Extraction Acceleration)
    print("Pre-computing base features for training set...")
    train_features = base_model.predict(X_train, batch_size=32, verbose=1)
    
    print("Pre-computing base features for validation set...")
    val_features = base_model.predict(X_val, batch_size=32, verbose=1)
    
    print(f"Features extracted. Train feature shape: {train_features.shape}")
    
    # Calculate and save centroids for Out-of-Distribution verification
    print("Calculating class centroids in feature space...")
    train_features_gap = np.mean(train_features, axis=(1, 2))  # shape: (N, 1280)
    centroids = {}
    for class_idx in range(num_classes):
        class_mask = (y_train == class_idx)
        class_feats = train_features_gap[class_mask]
        if len(class_feats) > 0:
            centroid = np.mean(class_feats, axis=0)
            centroid_norm = centroid / (np.linalg.norm(centroid) + 1e-8)
            centroids[all_classes[class_idx]] = centroid_norm.tolist()
        else:
            centroids[all_classes[class_idx]] = np.zeros(1280).tolist()
            
    centroids_path = os.path.join(backend_dir, "centroids.json")
    with open(centroids_path, "w") as f:
        json.dump(centroids, f)
    print(f"Saved class centroids to {centroids_path}")
    
    # Build dense classification head
    dense_model = models.Sequential([
        layers.GlobalAveragePooling2D(input_shape=train_features.shape[1:]),
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.2),
        layers.Dense(num_classes, activation='softmax')
    ])
    
    dense_model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    print(f"Training classification head on pre-computed features for {args.epochs} epochs...")
    dense_model.fit(
        train_features, y_train,
        epochs=args.epochs,
        batch_size=32,
        validation_data=(val_features, y_val),
        verbose=1
    )
    
    # Assemble the final model (combining base and classification head)
    print("Assembling combined sequential model...")
    final_model = models.Sequential([
        base_model,
        dense_model
    ])
    
    model_save_path = os.path.join(backend_dir, "crop_disease_model.keras")
    final_model.save(model_save_path)
    print(f"Model saved successfully to {model_save_path}")

if __name__ == "__main__":
    main()
