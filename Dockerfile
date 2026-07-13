# Backend — TurnoGO API
FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema (psycopg2 necesita libpq)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc && \
    rm -rf /var/lib/apt/lists/*

# Copiar e instalar dependencias Python
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar codigo
COPY backend/ .

# Puerto que usa Railway
EXPOSE 8000

# Comando para produccion
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
