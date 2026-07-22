"""
Startup validator — ensures all critical configuration is present before
the FastAPI application starts serving requests.

Called from main.py BEFORE app = FastAPI(...).

Two tiers:
  [CRITICAL] — missing -> RuntimeError (backend refuses to start)
  [OPTIONAL] — missing -> WARNING only (non-blocking, feature unavailable)

NEVER log actual secret values. Only log variable names.
"""


def validate_startup(settings) -> None:
    """
    Validates critical environment variables at startup.

    Raises RuntimeError only for truly critical variables.
    Warns (non-blocking) for optional/feature variables.
    """
    missing: list[str] = []
    warnings: list[str] = []

    # -- [CRITICAL] SECRET_KEY --
    # Already validated by config.Settings.validate_secret_key(),
    # listed here for completeness.
    if not settings.SECRET_KEY:
        missing.append("SECRET_KEY")

    # -- [CRITICAL] SYSTEM_WALLET_PRIVATE_KEY --
    if not (settings.SYSTEM_WALLET_PRIVATE_KEY or "").strip():
        missing.append("SYSTEM_WALLET_PRIVATE_KEY")

    # -- Block if any CRITICAL variable is missing --
    if missing:
        var_list = "\n".join(f"  - {v}" for v in missing)
        raise RuntimeError(
            "\n"
            "====================================================\n"
            "*** ERROR: Missing required env variables        |\n"
            "====================================================\n"
            "|                                                   |\n"
            f"|  Missing variables:                               |\n"
            f"{var_list}\n"
            "|                                                   |\n"
            "|  Add them to your .env file (development)         |\n"
            "|  or Railway Environment Variables.                |\n"
            "|                                                   |\n"
            "====================================================\n"
        )

    # -- [OPTIONAL] Cloudinary --
    cloudinary_missing = []
    if not (settings.CLOUDINARY_CLOUD_NAME or "").strip():
        cloudinary_missing.append("CLOUDINARY_CLOUD_NAME")
    if not (settings.CLOUDINARY_API_KEY or "").strip():
        cloudinary_missing.append("CLOUDINARY_API_KEY")
    if not (settings.CLOUDINARY_API_SECRET or "").strip():
        cloudinary_missing.append("CLOUDINARY_API_SECRET")
    if cloudinary_missing:
        warnings.append(
            f"Cloudinary: {', '.join(cloudinary_missing)} not set"
            " (avatar uploads will use local storage)"
        )

    # -- [OPTIONAL] Didit --
    if not (settings.DIDIT_API_KEY or "").strip():
        warnings.append("DIDIT_API_KEY (KYC verification unavailable)")
    if not (settings.DIDIT_WEBHOOK_SECRET or "").strip():
        warnings.append("DIDIT_WEBHOOK_SECRET (webhooks will use API key fallback)")
    if not (settings.DIDIT_WORKFLOW_ID or "").strip():
        warnings.append("DIDIT_WORKFLOW_ID (workflow-based verification not configured)")

    # -- [OPTIONAL] Email --
    if not (settings.SENDGRID_API_KEY or "").strip() and not (settings.RESEND_API_KEY or "").strip():
        warnings.append("SENDGRID_API_KEY or RESEND_API_KEY (email sending unavailable)")

    # -- [OPTIONAL] Web Push --
    if not (settings.VAPID_PRIVATE_KEY or "").strip():
        warnings.append("VAPID_PRIVATE_KEY (web push notifications unavailable)")

    # -- Print all warnings --
    if warnings:
        print("\n" + "=" * 50)
        print("[WARNING] Optional services not fully configured:")
        for w in warnings:
            print(f"   - {w}")
        print("=" * 50 + "\n")
