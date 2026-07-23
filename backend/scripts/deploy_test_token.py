"""
Script para desplegar un token USDT de prueba en Polygon Amoy Testnet.
"""

import sys

sys.path.insert(0, ".")
from eth_account import Account
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware

from app.config import get_settings

settings = get_settings()

# Conectar
w3 = Web3(Web3.HTTPProvider(settings.POLYGON_RPC_URL))
w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)

print(f"Connected: {w3.is_connected()}")
print(f"Chain ID: {w3.eth.chain_id}")
print(f"System wallet: {settings.SYSTEM_WALLET_ADDRESS}")

# Verificar MATIC balance
matic = w3.eth.get_balance(settings.SYSTEM_WALLET_ADDRESS)
print(f"MATIC balance: {w3.from_wei(matic, 'ether')} POL")
if matic == 0:
    print("\n❌ No tienes MATIC. Necesitas obtener POL de prueba.")
    print("Usa uno de estos faucets:")
    print("  https://faucet.polygon.technology/")
    print("  https://www.alchemy.com/faucets/polygon-amoy")
    print("  https://faucet.quicknode.com/polygon/amoy")
    sys.exit(1)

# Bytecode de un ERC-20 simple (TestUSDT)
# Es un contrato ERC-20 básico con función mint (solo owner puede llamar)
# Compilado con Solidity 0.8.20 + OpenZeppelin
TEST_USDT_BYTECODE = "0x608060405234801561001057600080fd5b506040518060400160405280600881526020017f54657374555344540000000000000000000000000000000000000000000000008152506040518060400160405280600481526020017f55534454000000000000000000000000000000000000000000000000000000008152508160039081610089919061035a565b508060049081610099919061035a565b5050506100b6336100bb60201b60201c565b61043c565b6000600560008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600190806001815401808255809150506001900390600052602060002001600090919091909150555050565b600081519050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806101a257607f821691505b6020821081036101b5576101b461015b565b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b60006008830261021d7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff826101e0565b61022786836101e0565b95508019841693508086168417925050509392505050565b6000819050919050565b6000819050919050565b600061026e6102696102648461023f565b610249565b61023f565b9050919050565b6000819050919050565b61028883610253565b61029c61029482610275565b8484546101ed565b8255505050565b600090565b6102b16102a3565b6102bc81848461027f565b505050565b5b818110156102e0576102d56000826102a8565b6001810190506102c2565b5050565b601f821115610325576102f6816101bb565b6102ff846101d0565b8101602085101561030e578190505b61032261031a856101d0565b8301826102c1565b50505b505050565b600082821c905092915050565b60006103486000198460080261032a565b1980831691505092915050565b600061036583836101e0565b915082600202905092915050565b600082825260208201905092915050565b61038e8261012b565b67ffffffffffffffff8111156103a7576103a661012c565b5b6103b1825461018a565b6103bc8282856102e4565b6000602094508286101590506001828216156103df576103f76103fa565b600184146103f1576103f061032a565b5b83825250505b505050565b60006104056039565b7f5465737455534454000000000000000000000000000000000000000000000000815260080190505b90565b6000896104488361012b565b8161045161012f565b61045b8193610373565b935061046f8385601f8401016101bb565b610478836101bb565b860191508a81111561048d5761048c61012f565b5b6020820191507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff820191506104c2828c6101e0565b91506104ce828b6101e0565b91506104da828a6101e0565b91506104e682896101e0565b91506104f282886101e0565b91506104fe82876101e0565b915061050a82866101e0565b915061051682856101e0565b915061052282846101e0565b915061052e82836101e0565b91508190509a995050505050505050505056"

# ABI del contrato (ERC-20 + mint)
TEST_USDT_ABI = [
    {
        "inputs": [{"name": "to", "type": "address"}, {"name": "amount", "type": "uint256"}],
        "name": "mint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [{"name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [{"name": "to", "type": "address"}, {"name": "amount", "type": "uint256"}],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "symbol",
        "outputs": [{"name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "name",
        "outputs": [{"name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function",
    },
]

print("\n📦 Desplegando TestUSDT...")

account = Account.from_key(settings.SYSTEM_WALLET_PRIVATE_KEY)

# Crear contrato
TestUSDT = w3.eth.contract(abi=TEST_USDT_ABI, bytecode=TEST_USDT_BYTECODE)

# Construir transacción de deploy
nonce = w3.eth.get_transaction_count(settings.SYSTEM_WALLET_ADDRESS)
tx = TestUSDT.constructor().build_transaction(
    {
        "from": settings.SYSTEM_WALLET_ADDRESS,
        "nonce": nonce,
        "gas": 2000000,
        "gasPrice": w3.eth.gas_price,
    }
)

# Firmar
signed = account.sign_transaction(tx)
print(f"Enviando deploy... (nonce: {nonce})")

# Enviar
tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
print(f"Tx hash: {w3.to_hex(tx_hash)}")

# Esperar confirmación
receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
contract_address = receipt["contractAddress"]
print(f"\n✅ Contrato desplegado en: {contract_address}")

# Mintear 10,000 tokens a la wallet del sistema
contract = w3.eth.contract(address=contract_address, abi=TEST_USDT_ABI)
decimals = contract.functions.decimals().call()
print(f"Decimals: {decimals}")

amount = 10000 * (10**decimals)  # 10,000 tokens
nonce2 = w3.eth.get_transaction_count(settings.SYSTEM_WALLET_ADDRESS)
mint_tx = contract.functions.mint(settings.SYSTEM_WALLET_ADDRESS, amount).build_transaction(
    {
        "from": settings.SYSTEM_WALLET_ADDRESS,
        "nonce": nonce2,
        "gas": 100000,
        "gasPrice": w3.eth.gas_price,
    }
)

signed2 = account.sign_transaction(mint_tx)
mint_hash = w3.eth.send_raw_transaction(signed2.raw_transaction)
receipt2 = w3.eth.wait_for_transaction_receipt(mint_hash, timeout=120)

if receipt2["status"] == 1:
    print(f"✅ Minteados 10,000 TestUSDT a {settings.SYSTEM_WALLET_ADDRESS}")
    balance = contract.functions.balanceOf(settings.SYSTEM_WALLET_ADDRESS).call()
    print(f"   Balance: {balance / (10**decimals)} TestUSDT")
else:
    print("❌ Error minteando tokens")

print("\n📝 Agrega esto a tu .env:")
print(f"USDT_CONTRACT_ADDRESS={contract_address}")
