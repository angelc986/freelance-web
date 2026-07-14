import re

path = r'C:\Users\yochi\Desktop\freelance-web\frontend\src\app\dashboard\settings\page.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Cambiar input text-sm a text-base (solo en classNames de inputs)
content = content.replace('rounded-xl text-sm focus:ring-2 focus:ring-primary/20', 'rounded-xl text-base sm:text-sm focus:ring-2 focus:ring-primary/20')

# 2. Email input
content = content.replace('text-gray text-sm" />', 'text-gray text-base sm:text-sm" />')

# 3. Avatar bigger
content = content.replace('w-14 h-14', 'w-16 h-16')
content = content.replace('text-base sm:text-2xl font-bold', 'text-lg sm:text-2xl font-bold')

# 4. Input labels already changed

# 5. Section headers bigger
content = content.replace('text-[17px]', 'text-[18px]')

# 6. Wallet input
content = content.replace('rounded-xl text-sm font-mono focus:ring-2', 'rounded-xl text-base sm:text-sm font-mono focus:ring-2')

# 7. Account info rows - make label and value bigger
content = content.replace('<span className=\"text-sm sm:text-sm text-gray\">Rol</span>', '<span className=\"text-base sm:text-sm text-gray\">Rol</span>')
content = content.replace('<span className=\"text-sm sm:text-sm text-dark font-medium\">\n              {user.role === "worker" ? "Trabajador" : "Contratista"}\n            </span>', '<span className=\"text-base sm:text-sm text-dark font-medium\">\n              {user.role === "worker" ? "Trabajador" : "Contratista"}\n            </span>')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done!")
