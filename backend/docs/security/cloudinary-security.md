# 🖼️ Cloudinary Security — Avatar Service (Fase 10.4)

> **Ultima actualizacion:** 2026-07-24  
> **Estado:** 🟢 Produccion-seguro (CLOUD-01/02/03 implementados)  

---

## 📊 Flujo de Avatar

```
POST /users/avatar          Webhook Didit (KYC)
       │                           │
       ▼                           ▼
 upload_avatar()            upload_avatar_from_url()
       │                           │
       ▼                           ▼
 validate_image()           validate_image()
  (Pillow real)              (Pillow real)
       │                           │
       ▼                           ▼
 Cloudinary upload          Cloudinary upload
       │                           │
  ┌────┴────┐              ┌────┴────┐
  OK   FAIL               OK   FAIL
  │     │                  │     │
  ▼     ▼                  ▼     ▼
200   502                200  avatar=none
      (sin fallback)          (user igual
      local)                  verificado)
```

---

## 🛡️ Validacion de Imagen (CLOUD-03)

Toda imagen pasa por `validate_image()` en `cloudinary_service.py`:

| Check | Metodo | Limite |
|-------|--------|--------|
| Archivo valido | `PIL.Image.open().verify()` | - |
| Formato real | `img.format` en `{"JPEG", "PNG", "WEBP"}` | Sin GIF |
| Tamano archivo | `len(bytes)` | 10 MB |
| Dimensiones | `img.width`, `img.height` | 4000x4000 px |
| Conversion | RGB con fondo blanco | Transparencia → blanco |
| Output | JPEG quality 85, optimized | - |

**No se confia en `file.content_type`.** Pillow inspecciona los magic bytes reales.

---

## 📁 Estrategia de public_id (CLOUD-02)

```
turnogo/avatars/
├── manual/user_{id}      ← POST /users/avatar
└── verified/user_{id}    ← Webhook KYC Didit
```

| Carpeta | Fuente | Modificable por usuario | Sobrescribe |
|---------|--------|------------------------|-------------|
| `manual/` | `POST /users/avatar` | Si (si no verificado) | Si |
| `verified/` | Webhook Didit | **No** | Si |

---

## 🚫 Sin Fallback Local (CLOUD-01)

Si Cloudinary no esta disponible:

- **Antes:** Se guardaba en `uploads/` servido como `StaticFiles`
- **Ahora:** `502 Service Unavailable` — "No fue posible subir la imagen. Intenta nuevamente."

No hay dos sistemas de almacenamiento con reglas de seguridad distintas.

---

## 🔁 Eliminacion de Avatares Viejos (CLOUD-06)

```python
# Al cambiar avatar:
previous_public_id = get_public_id(user.id)
cloudinary_url = upload_avatar(contents, user.id)
if previous_avatar:
    delete_avatar(previous_public_id)  # Limpia el viejo
```

Los avatares viejos se eliminan de Cloudinary inmediatamente.

---

## ⏱️ Rate Limiting

```
POST /users/avatar → @limiter.limit("10/minute")
```

Protege contra spam, abuso y costos innecesarios.

---

## 🔧 Configuracion Unificada (CLOUD-05)

Toda operacion Cloudinary pasa por `cloudinary_service.py`. No hay `cloudinary.config()` duplicado en ningun otro archivo.

```python
# Single source of truth:
cloudinary_service.py
├── _configure()           # Lazy init, secure=True, una sola vez
├── validate_image()       # Pillow
├── upload_avatar()        # Manual (manual/user_{id})
├── upload_avatar_from_url() # KYC (verified/user_{id})
├── delete_avatar()        # Limpieza
└── get_public_id()        # Consistencia de nombres
```

---

## 📋 Checklist Pre-Produccion

- [x] CLOUD-01: Sin fallback local → 502
- [x] CLOUD-02: public_id unificado (manual/verified)
- [x] CLOUD-03: Validacion real con Pillow
- [x] Rate limiting: 10/min en POST /users/avatar
- [x] CLOUD-06: delete_avatar al cambiar
- [x] CLOUD-05: Config centralizada en cloudinary_service.py
- [x] CLOUD-07: Sin filename del usuario (no se usa)
- [ ] CLOUD-04: Rate limit en subida desde webhook (baja prioridad)
- [ ] CLOUD-08: Soporte GIF con transformacion (baja prioridad)

---

## ⚠️ Riesgos Residuales

### Dependencia externa

| Dependencia | Impacto si falla | Mitigacion |
|-------------|-----------------|------------|
| Cloudinary API | No se puede subir avatar | 502 claro. KYC sigue verificando sin foto. |
| Pillow | Validacion falla | `ImageValidationError` → 400 explicito |

### Bajo

- GIF no soportado con transformacion facial (CLOUD-08)
- Webhook KYC no tiene rate limit propio (CLOUD-04)
