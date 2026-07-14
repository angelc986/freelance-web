path = r'C:\Users\yochi\Desktop\freelance-web\frontend\src\app\dashboard\settings\page.tsx'

with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Main container - add p-4 base
c = c.replace(
    'max-w-3xl mx-auto space-y-1 sm:space-y-6',
    'max-w-3xl mx-auto p-4 sm:p-0 space-y-3 sm:space-y-6'
)

# 2. Form content space-y
c = c.replace(
    'sm:p-6 space-y-4',
    'sm:p-6 space-y-3 sm:space-y-4'
)

# 3. Avatar smaller on mobile  
c = c.replace(
    'w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden ring-2 ring-gray-200',
    'w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg sm:text-2xl font-bold overflow-hidden ring-2 ring-gray-200'
)

# 4. Cerrar sesion - hide text on mobile, simpler button
c = c.replace(
    '<p className="text-sm text-gray">Al cerrar sesi\u00f3n tendr\u00e1s que volver a iniciar sesi\u00f3n para acceder al dashboard.</p>',
    '<p className="hidden sm:block text-sm text-gray">Al cerrar sesi\u00f3n tendr\u00e1s que volver a iniciar sesi\u00f3n para acceder al dashboard.</p>'
)

# Change cerrar sesion button to be full-width red on mobile
c = c.replace(
    'className="inline-flex items-center gap-2 bg-gray-100 text-gray px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50 hover:text-red-500 hover:-translate-y-0.5 transition-all">\n            <IconLogout className="w-4 h-4" />\n            Cerrar sesi\u00f3n',
    'className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-red-50 text-red-500 sm:bg-gray-100 sm:text-gray px-4 sm:px-6 py-3 sm:py-2.5 rounded-xl text-sm font-medium hover:bg-red-100 hover:text-red-600 transition-all">\n            <IconLogout className="w-4 h-4" />\n            Cerrar sesi\u00f3n'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

print("Done!")
