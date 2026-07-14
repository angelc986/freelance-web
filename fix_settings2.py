import re

path = r'C:\Users\yochi\Desktop\freelance-web\frontend\src\app\dashboard\settings\page.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix email input text-base (was text-base sm:text-sm, change to just text-base)
content = content.replace('text-gray text-base sm:text-sm', 'text-gray text-base')
# Also other sm:text-sm on inputs - keep text-base all the way

# Fix section headers - show icon on mobile again (smaller)
content = content.replace('hidden sm:flex w-9 h-9', 'flex sm:flex w-7 h-7 sm:w-9 sm:h-9')

# Fix section header subtitle
content = content.replace('hidden sm:block text-xs text-gray', 'text-[11px] sm:block text-xs text-gray')

# Reduce section spacing
content = content.replace('space-y-3 sm:space-y-6', 'space-y-2 sm:space-y-6')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done!")
