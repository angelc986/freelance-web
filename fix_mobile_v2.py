path = r'C:\Users\yochi\Desktop\freelance-web\frontend\src\app\dashboard\settings\page.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove card borders on mobile
content = content.replace(
    'className="bg-white rounded-2xl border border-gray-200 overflow-hidden"',
    'className="sm:bg-white sm:rounded-2xl sm:border sm:border-gray-200 overflow-hidden"'
)

# 2. Hide section headers on mobile
content = content.replace(
    'className="bg-gradient-to-r from-blue-50 to-white px-6 py-4 border-b border-gray-100"',
    'className="hidden sm:flex bg-gradient-to-r from-blue-50 to-white px-6 py-4 border-b border-gray-100"'
)
content = content.replace(
    'className="bg-gradient-to-r from-emerald-50 to-white px-6 py-4 border-b border-gray-100"',
    'className="hidden sm:flex bg-gradient-to-r from-emerald-50 to-white px-6 py-4 border-b border-gray-100"'
)
content = content.replace(
    'className="bg-gradient-to-r from-red-50 to-white px-6 py-4 border-b border-gray-100"',
    'className="hidden sm:flex bg-gradient-to-r from-red-50 to-white px-6 py-4 border-b border-gray-100"'
)
content = content.replace(
    'className="bg-gradient-to-r from-violet-50 to-white px-6 py-4 border-b border-gray-100"',
    'className="hidden sm:flex bg-gradient-to-r from-violet-50 to-white px-6 py-4 border-b border-gray-100"'
)

# 3. Remove gap between sections on mobile
content = content.replace(
    'className="max-w-3xl mx-auto space-y-6"',
    'className="max-w-3xl mx-auto space-y-0 sm:space-y-6"'
)

# 4. Reduce form padding on mobile
content = content.replace(
    'className="p-6 space-y-4"',
    'className="sm:p-6 space-y-4"'
)
content = content.replace(
    'className="p-6 space-y-0.5 text-sm"',
    'className="sm:p-6 space-y-0.5 text-sm"'
)

# 5. Hide Cerrar sesion section header content (text/button are fine)
# Actually the cerrar sesion section just has text and a button, no form
# Let's handle the cerrar sesion section content
# The section wrapper is already handled by #1

# 6. Add subtle separator between sections on mobile
# No change needed - the sections stack directly with no gap now

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done! All replacements applied.")
