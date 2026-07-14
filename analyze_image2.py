from PIL import Image, ImageFilter
import numpy as np

img = Image.open('C:\\Users\\yochi\\.openclaw\\workspace\\screenshot_settings.png')
if img.mode == 'RGBA':
    img = img.convert('RGB')

# Get edges to see layout structure
gray = img.convert('L')
edges = gray.filter(ImageFilter.FIND_EDGES)
edges_np = np.array(edges)

# Find horizontal lines (section dividers)
h_sum = np.sum(edges_np > 80, axis=1)  # sum of edge pixels per row

print("Horizontal edge density (rows with significant edges):")
for y, count in enumerate(h_sum):
    if count > 50:  # significant horizontal edge
        width_pct = count / edges_np.shape[1] * 100
        print(f"  Row {y}: {width_pct:.0f}% of width has edges")

# Analyze color bands - find where white cards start/end
img_np = np.array(img)
white_mask = np.all(img_np > 240, axis=2)  # near-white pixels
# Find rows where >60% is white
white_rows = np.sum(white_mask, axis=1) / img_np.shape[1]

print("\nWhite band analysis (>60% white pixels per row):")
in_band = False
band_start = 0
for y, pct in enumerate(white_rows):
    if pct > 0.6 and not in_band:
        band_start = y
        in_band = True
    elif pct <= 0.6 and in_band:
        print(f"  White band: rows {band_start}-{y} ({y-band_start}px)")
        in_band = False
if in_band:
    print(f"  White band: rows {band_start}-end ({img_np.shape[0]-band_start}px)")
