import re

path = r'C:\Users\yochi\Desktop\freelance-web\frontend\src\app\dashboard\settings\page.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Instead of complex replacements, let's do targeted string replacements

# 1. Profile section: remove card borders on mobile, hide header on mobile
old_profile = '''      {/* PROFILE */}
      <section className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden">
        <div className="sm:bg-gradient-to-r sm:from-blue-50 sm:to-white px-3 sm:px-6 py-2 sm:py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-100 text-blue-600 items-center justify-center">
              <IconUser className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-base font-semibold text-dark">Informaci\u00f3n personal</h2>
              <p className="hidden sm:block text-xs text-gray">Nombre y tel\u00e9fono</p>
            </div>
          </div>
        </div>'''

new_profile = '''      {/* PROFILE */}
      <section className="sm:bg-white sm:rounded-2xl sm:border sm:border-gray-200 overflow-hidden">
        <div className="hidden sm:flex bg-gradient-to-r from-blue-50 to-white px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <IconUser className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-dark">Informaci\u00f3n personal</h2>
              <p className="text-xs text-gray">Nombre y tel\u00e9fono</p>
            </div>
          </div>
        </div>'''

if old_profile in content:
    content = content.replace(old_profile, new_profile)
    print("Profile section replaced")
else:
    print("Profile section NOT FOUND")

# 2. Wallet section  
old_wallet = '''      {/* WALLET */}
      <section className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden">
        <div className="sm:bg-gradient-to-r sm:from-emerald-50 sm:to-white px-3 sm:px-6 py-2 sm:py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-100 text-emerald-600 items-center justify-center">
              <IconWallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-base font-semibold text-dark">Wallet USDT</h2>
              <p className="hidden sm:block text-xs text-gray">Direcci\u00f3n de Polygon</p>
            </div>
          </div>
        </div>'''

new_wallet = '''      {/* WALLET */}
      <section className="sm:bg-white sm:rounded-2xl sm:border sm:border-gray-200 overflow-hidden">
        <div className="hidden sm:flex bg-gradient-to-r from-emerald-50 to-white px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <IconWallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-dark">Wallet USDT</h2>
              <p className="text-xs text-gray">Direcci\u00f3n de Polygon</p>
            </div>
          </div>
        </div>'''

if old_wallet in content:
    content = content.replace(old_wallet, new_wallet)
    print("Wallet section replaced")
else:
    print("Wallet section NOT FOUND")

# 3. Account info section
old_account = '''      {/* ACCOUNT INFO */}
      <section className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden">
        <div className="sm:bg-gradient-to-r sm:from-violet-50 sm:to-white px-3 sm:px-6 py-2 sm:py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-violet-100 text-violet-600 items-center justify-center">
              <IconInfo className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-base font-semibold text-dark">Informaci\u00f3n de la cuenta</h2>
            </div>
          </div>
        </div>'''

new_account = '''      {/* ACCOUNT INFO */}
      <section className="sm:bg-white sm:rounded-2xl sm:border sm:border-gray-200 overflow-hidden">
        <div className="hidden sm:flex bg-gradient-to-r from-violet-50 to-white px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
              <IconInfo className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-dark">Informaci\u00f3n de la cuenta</h2>
            </div>
          </div>
        </div>'''

if old_account in content:
    content = content.replace(old_account, new_account)
    print("Account info section replaced")
else:
    print("Account info section NOT FOUND")

# 4. Remove border from Cerrar sesion button on mobile  
content = content.replace(
    'border border-gray-200',
    'sm:border sm:border-gray-200'
)

# But not inside section content - only for the outer containers
# Actually this would replace too many things. Let me be more specific.
# Re-read the file and revert that change.

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done!")
