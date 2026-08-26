import os
import json
import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

def load_dataset(dataset_dir, max_samples_per_class=150, target_size=(128, 128)):
    classes = sorted([d for d in os.listdir(dataset_dir) if os.path.isdir(os.path.join(dataset_dir, d))])
    
    X = []
    y = []
    
    for idx, cls in enumerate(classes):
        cls_path = os.path.join(dataset_dir, cls)
        img_names = [f for f in os.listdir(cls_path) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
        # Shuffle/limit samples
        img_names = img_names[:max_samples_per_class]
        
        print(f"Loading {len(img_names)} images for class: {cls}")
        for img_name in img_names:
            img_path = os.path.join(cls_path, img_name)
            try:
                with Image.open(img_path) as img:
                    img = img.convert('RGB')
                    img = img.resize(target_size)
                    arr = np.array(img, dtype=np.float32)
                    arr = preprocess_input(arr)
                    X.append(arr)
                    y.append(idx)
            except Exception as e:
                print(f"Error loading {img_path}: {e}")
                
    return np.array(X), np.array(y), classes

def main():
    train_dir = r"d:\CropDiseaseProject\dataset\PlantVillage\train"
    val_dir = r"d:\CropDiseaseProject\dataset\PlantVillage\val"
    backend_dir = r"d:\CropDiseaseProject\backend"
    
    os.makedirs(backend_dir, exist_ok=True)
    
    print("Loading training dataset...")
    X_train, y_train, train_classes = load_dataset(train_dir, max_samples_per_class=150)
    
    print("Loading validation dataset...")
    X_val, y_val, val_classes = load_dataset(val_dir, max_samples_per_class=30)
    
    assert train_classes == val_classes, "Train and Val classes mismatch!"
    
    num_classes = len(train_classes)
    print(f"Dataset loaded. X_train shape: {X_train.shape}, X_val shape: {X_val.shape}")
    
    # Save class names mapping
    class_map_path = os.path.join(backend_dir, "class_names.json")
    with open(class_map_path, "w") as f:
        json.dump(train_classes, f, indent=4)
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
    
    # Build dense classification model
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
    
    print("Training classification head on pre-computed features...")
    dense_model.fit(
        train_features, y_train,
        epochs=15,
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
