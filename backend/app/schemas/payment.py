from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class DepositRequest(BaseModel):
    """
    Cuando un contratista deposita USDT, nos da:
    - El hash de la transacción en Polygon (tx_hash)
    - El monto que depositó
    - La red que usó (polygon por defecto)
    
    web3.py verificará que la transacción sea real en la blockchain.
    """
    tx_hash: str
    amount: float
    network: str = "polygon"


class TransactionResponse(BaseModel):
    """
    Lo que devolvemos al usuario cuando consulta una transacción.
    """
    id: int
    user_id: int
    job_id: Optional[int] = None
    type: str
    amount: float
    fee: float
    network: str
    tx_hash: Optional[str] = None
    from_address: Optional[str] = None
    to_address: Optional[str] = None
    confirmations: int
    status: str
    requires_confirmation: bool = False
    confirmation_token: Optional[str] = None
    created_at: datetime
    confirmed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BalanceResponse(BaseModel):
    """
    Saldo del usuario.
    """
    balance: float
    held_balance: float = 0.0
    available_balance: float = 0.0
    wallet_address: Optional[str] = None

    class Config:
        from_attributes = True


class WithdrawRequest(BaseModel):
    """
    Cuando un worker quiere retirar USDT a su wallet externa.
    """
    amount: float
    to_address: str


class ReleaseRequest(BaseModel):
    """
    Liberar pago al worker cuando el trabajo se completa.
    """
    job_id: int


class PaymentHistoryResponse(BaseModel):
    transactions: list[TransactionResponse]
    total: int


class ConfirmPaymentRequest(BaseModel):
    """
    Token de confirmación para montos > $100.
    """
    confirmation_token: str


class ScanDepositRequest(BaseModel):
    """
    Parámetros para escanear depósitos en la blockchain.
    """
    from_block: Optional[int] = None  # Si no se especifica, escanea los últimos 10000 bloques


class DetectedDeposit(BaseModel):
    """Depósito encontrado en la blockchain."""
    tx_hash: str
    from_address: str
    amount: float
    block_number: int
    registered: bool  # True si ya existe en BD
    user_email: Optional[str] = None
