import json
import queue
import threading
import asyncio
from typing import AsyncGenerator, Generator

# Colas de eventos por usuario: user_id -> list[queue.Queue]
_queues: dict[int, list[queue.Queue]] = {}
_lock = threading.Lock()

def subscribe(user_id: int) -> queue.Queue:
    """Registra un cliente SSE y devuelve su cola."""
    q: queue.Queue = queue.Queue(maxsize=100)
    with _lock:
        if user_id not in _queues:
            _queues[user_id] = []
        _queues[user_id].append(q)
    return q

def unsubscribe(user_id: int, q: queue.Queue):
    """Desregistra un cliente SSE."""
    with _lock:
        if user_id in _queues:
            _queues[user_id] = [x for x in _queues[user_id] if x is not q]
            if not _queues[user_id]:
                del _queues[user_id]

def publish(user_id: int, event: str, data: dict):
    """Publica un evento a todos los clientes de un usuario."""
    payload = json.dumps({"event": event, "data": data})
    with _lock:
        if user_id not in _queues:
            return
        dead: list[queue.Queue] = []
        for q in _queues[user_id]:
            try:
                q.put_nowait(payload)
            except queue.Full:
                dead.append(q)
        for q in dead:
            _queues[user_id].remove(q)

async def event_generator(user_id: int) -> AsyncGenerator[str, None]:
    """Generador SSE asincrono. Thread-safe."""
    q = subscribe(user_id)
    try:
        # Send immediate connection confirmation
        yield ": connected\n\n"
        while True:
            try:
                msg = q.get_nowait()
                yield f"data: {msg}\n\n"
            except queue.Empty:
                yield ": heartbeat\n\n"
                await asyncio.sleep(5)  # Heartbeat every 5s
    except GeneratorExit:
        pass
    finally:
        unsubscribe(user_id, q)
