with open(r'C:\Users\yochi\Desktop\freelance-web\frontend\src\app\dashboard\settings\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Check if key parts exist
checks = [
    'PROFILE',
    'bg-white rounded-xl',
    'border-b border-gray-100',
    'hidden sm:flex w-9 h-9',
    'IconUser',
]

for check in checks:
    found = check in content
    print(f"'{check}': {'FOUND' if found else 'NOT FOUND'}")

# Print the exact text around PROFILE section
idx = content.find('PROFILE')
if idx >= 0:
    # Print 200 chars before and 200 after
    start = max(0, idx - 50)
    end = min(len(content), idx + 400)
    print("\n=== Context around PROFILE ===")
    print(repr(content[start:end]))
