from pydantic_settings import BaseSettings
from functools import lru_cache
import os
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Freelance App API"
    APP_VERSION: str = "0.2.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./freelance.db")

    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Polygon / Blockchain
    SYSTEM_WALLET_ADDRESS: str = os.getenv("SYSTEM_WALLET_ADDRESS", "")
    SYSTEM_WALLET_PRIVATE_KEY: str = os.getenv("SYSTEM_WALLET_PRIVATE_KEY", "")
    POLYGON_RPC_URL: str = os.getenv("POLYGON_RPC_URL", "https://rpc-amoy.polygon.technology")
    USDT_CONTRACT_ADDRESS: str = os.getenv("USDT_CONTRACT_ADDRESS", "")

    # Seguridad
    MIN_CONFIRMATIONS: int = 12  # Confirmaciones en Polygon para considerar un depósito válido
    MAX_WITHDRAWALS_PER_DAY: int = 3
    LARGE_TX_THRESHOLD: float = 100.0  # Monto para doble confirmación


@lru_cache()
def get_settings() -> Settings:
    return Settings()
