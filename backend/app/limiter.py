import os

from slowapi import Limiter
from slowapi.util import get_remote_address

# En tests, rate limiting desactivado (100k requests/minuto = practicamente infinito)
default_limit = "100000/minute" if os.getenv("TESTING") else "60/minute"

limiter = Limiter(key_func=get_remote_address, default_limits=[default_limit])
