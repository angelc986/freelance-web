path = r'C:\Users\yochi\Desktop\freelance-web\frontend\src\app\dashboard\settings\page.tsx'

with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Main container - add p-4 base
c = c.replace(
    'className="max-w-3xl mx-auto space-y-1 sm:space-y-6"',
    'className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6"'
)

# 2. Form content - reduce space-y
c = c.replace(
    'className="sm:p-6 space-y-4"',
    'className="sm:p-6 space-y-3 sm:space-y-4"'
)

# 3. Avatar smaller on mobile
c = c.replace(
    'w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden ring-2 ring-gray-200',
    'w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-base sm:text-2xl font-bold overflow-hidden ring-2 ring-gray-200'
)

# 4. Input base font size bigger on mobile
import re

# Email input
c = c.replace(
    'bg-gray-50 text-gray text-sm" />',
    'bg-gray-50 text-gray text-base sm:text-sm" />'
)

# Name and phone inputs - text-sm to text-base
c = c.replace('rounded-xl text-sm focus:ring-2 focus:ring-primary/20', 'rounded-xl text-base sm:text-sm focus:ring-2 focus:ring-primary/20')

# Wallet input
c = c.replace(
    'rounded-xl text-sm font-mono focus:ring-2',
    'rounded-xl text-base sm:text-sm font-mono focus:ring-2'
)

# 5. Cerrar sesion - simpler on mobile
# Remove the section wrapper, remove text paragraph, simpler button
old_logout = '''      {/* CERRAR SESION */}
      <section className="sm:bg-white sm:rounded-2xl sm:border sm:border-gray-200 overflow-hidden">
        <div className="hidden sm:flex bg-gradient-to-r from-red-50 to-white px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-500 flex items-center justify-center">
              <IconLogout className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-dark">Cerrar sesi\u00f3n</h2>
              <p className="text-xs text-gray">Salir de tu cuenta</p>
            </div>
          </div>
        </div>

        <div className="sm:p-6 space-y-4">
          <p className="text-sm text-gray">Al cerrar sesi\u00f3n tendr\u00e1s que volver a iniciar sesi\u00f3n para acceder al dashboard.</p>
          <button
            onClick={() => {
              localStorage.removeItem("access_token");
              localStorage.removeItem("refresh_token");
              router.push("/");
            }}
            className="inline-flex items-center gap-2 bg-gray-100 text-gray px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50 hover:text-red-500 hover:-translate-y-0.5 transition-all"
          >
            <IconLogout className="w-4 h-4" />
            Cerrar sesi\u00f3n
          </button>
        </div>
      </section>'''

new_logout = '''      {/* CERRAR SESION */}
      <div className="sm:bg-white sm:rounded-2xl sm:border sm:border-gray-200 overflow-hidden">
        <div className="hidden sm:flex bg-gradient-to-r from-red-50 to-white px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-500 flex items-center justify-center">
              <IconLogout className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-dark">Cerrar sesi\u00f3n</h2>
              <p className="text-xs text-gray">Salir de tu cuenta</p>
            </div>
          </div>
        </div>

        <div className="sm:p-6">
          <p className="hidden sm:block text-sm text-gray mb-4">Al cerrar sesi\u00f3n tendr\u00e1s que volver a iniciar sesi\u00f3n para acceder al dashboard.</p>
          <button
            onClick={() => {
              localStorage.removeItem("access_token");
              localStorage.removeItem("refresh_token");
              router.push("/");
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 py-2.5 sm:px-6 sm:py-2.5 rounded-xl text-sm font-medium text-red-500 bg-red-50 sm:bg-gray-100 sm:text-gray hover:bg-red-100 hover:text-red-600 transition-all"
          >
            <IconLogout className="w-4 h-4" />
            Cerrar sesi\u00f3n
          </button>
        </div>
      </div>'''

if old_logout in c:
    c = c.replace(old_logout, new_logout)
    print("Logout section replaced")
else:
    print("Logout section NOT FOUND - checking exact match...")
    # Find the cerrar sesion section
    start = c.find('CERRAR SESION')
    if start >= 0:
        print(f"Found at position {start}")
        print(repr(c[start:start+200]))

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

print("Done!")
