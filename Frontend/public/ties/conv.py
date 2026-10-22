WideBalckDot= 2
DarkWine = 2
BlackPattern = 1
BlackCriss = 2
BrownSkinTie = 1
DarkWineDotted = 1
WideTie = 1

import os
from PIL import Image

def batch_compress(input_dir, output_dir, quality=75):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    for filename in os.listdir(input_dir):
        if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            input_path = os.path.join(input_dir, filename)
            output_path = os.path.join(output_dir, filename)
            
            with Image.open(input_path) as img:
                # Convert PNGs to RGB if saving as JPEG (JPEGs don't support transparency)
                if img.mode in ("RGBA", "P") and filename.lower().endswith(('.jpg', '.jpeg')):
                    img = img.convert("RGB")
                
                img.save(output_path, "JPEG", optimize=True, quality=quality)
                print(f"Compressed: {filename}")

# Example Usage
batch_compress("./", "compressed_photos", quality=75)