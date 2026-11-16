
import os
from PIL import Image
import pillow_heif

# Register HEIC support
pillow_heif.register_heif_opener()

# Folder containing HEIC images
input_folder = "./"

# Folder to save converted JPG images
output_folder = "converted_images"

# Create output folder if it doesn't exist
os.makedirs(output_folder, exist_ok=True)

# Loop through all files
for filename in os.listdir(input_folder):

    if filename.lower().endswith((".heic", ".heif")):

        input_path = os.path.join(input_folder, filename)

        # Change extension to .jpg
        output_filename = os.path.splitext(filename)[0] + ".jpg"
        output_path = os.path.join(output_folder, output_filename)

        try:
            img = Image.open(input_path)
            img = img.convert("RGB")

            img.save(output_path, "JPEG", quality=60)

            print(f"Converted: {filename} -> {output_filename}")

        except Exception as e:
            print(f"Failed: {filename} | Error: {e}")

print("All conversions completed!")
