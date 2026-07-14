from PIL import Image
import collections

img = Image.open('C:\\Users\\yochi\\.openclaw\\workspace\\screenshot_settings.png')
print(f"Size: {img.size}")
print(f"Mode: {img.mode}")

# Convert to RGB if needed
if img.mode == 'RGBA':
    img = img.convert('RGB')

# Get pixel colors for analysis
pixels = list(img.getdata())

# Count most common colors
counter = collections.Counter(pixels)
top_colors = counter.most_common(15)

print("\nMost common colors (RGB):")
for color, count in top_colors:
    # Convert to hex
    hex_color = '#{:02x}{:02x}{:02x}'.format(*color)
    pct = count / len(pixels) * 100
    print(f"  {hex_color}: {count}px ({pct:.1f}%)")
