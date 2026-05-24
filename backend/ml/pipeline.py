"""Lightweight inference helpers for the System Threat Forecaster API.

Heavy scientific Python wheels do not fit inside Vercel Hobby's serverless
storage limit. This module keeps the same API routes working with a small,
deterministic risk scorer that has no external runtime dependencies.
"""
from __future__ import annotations

from math import exp

from ml.features import FEATURES


MODEL_NAMES = [
    "XGBoost",
    "Random Forest",
    "Gradient Boosting",
    "Voting Classifier",
    "Stacking Classifier",
]

MODEL_BIAS = {
    "XGBoost": 0.00,
    "Random Forest": -0.03,
    "Gradient Boosting": 0.02,
    "Voting Classifier": -0.01,
    "Stacking Classifier": 0.01,
}


def get_models() -> dict:
    return {name: name for name in MODEL_NAMES}


def _as_float(value, default: float = 0.0) -> float:
    if value in (None, ""):
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _bool(value, default: int = 0) -> int:
    if value in (None, ""):
        return default
    if isinstance(value, str):
        return 1 if value.strip().lower() in {"1", "true", "yes", "on"} else 0
    return 1 if int(float(value)) else 0


def _defaults() -> dict:
    return {feat["name"]: feat.get("default", 0) for feat in FEATURES}


def _risk_probability(raw: dict, model_name: str) -> float:
    row = _defaults()
    row.update(raw or {})

    ram = _as_float(row.get("Census_TotalPhysicalRAM"), 8192)
    disk = _as_float(row.get("Census_PrimaryDiskTotalCapacity"), 500000)
    system_disk = _as_float(row.get("Census_SystemVolumeTotalCapacity"), 100000)
    cores = _as_float(row.get("Census_ProcessorCoreCount"), 4)
    os_build = _as_float(row.get("OsBuild"), 17134)
    battery = _as_float(row.get("Census_InternalBatteryNumberOfCharges"), 0)
    country = _as_float(row.get("CountryIdentifier"), 109)

    score = MODEL_BIAS.get(model_name, 0.0)
    score += 0.42 if not _bool(row.get("Firewall"), 1) else -0.22
    score += 0.34 if not _bool(row.get("Census_IsSecureBootEnabled"), 1) else -0.28
    score += 0.20 if _bool(row.get("Wdft_IsGamer"), 0) else -0.04
    score += 0.16 if _bool(row.get("Census_IsVirtualDevice"), 0) else 0.0
    score += 0.14 if _bool(row.get("Census_HasOpticalDiskDrive"), 0) else 0.0
    score += 0.12 if ram < 4096 else -0.08 if ram >= 8192 else 0.0
    score += 0.08 if disk < 128000 else 0.0
    score += 0.08 if system_disk < 64000 else 0.0
    score += 0.06 if cores <= 2 else -0.04 if cores >= 8 else 0.0
    score += 0.06 if os_build < 15000 else -0.04 if os_build > 19000 else 0.0
    score += 0.05 if battery > 2500 else 0.0
    score += ((country % 17) - 8) / 220

    smart_screen = str(row.get("SmartScreen", "")).lower()
    if smart_screen in {"off", ""}:
        score += 0.18
    elif smart_screen in {"block", "requireadmin"}:
        score -= 0.12

    return 1 / (1 + exp(-score))


def predict_single(raw: dict, model_name: str = "XGBoost") -> dict:
    if model_name not in MODEL_NAMES:
        raise ValueError(f"Unknown model: {model_name}")

    probability = _risk_probability(raw, model_name)
    pred = 1 if probability >= 0.5 else 0
    confidence = probability if pred == 1 else 1 - probability
    return {
        "prediction": pred,
        "label": "Threat Detected" if pred == 1 else "No Threat",
        "confidence": round(confidence, 4),
        "model": model_name,
    }


def predict_batch(rows: list[dict], model_name: str = "XGBoost") -> list[dict]:
    if model_name not in MODEL_NAMES:
        raise ValueError(f"Unknown model: {model_name}")

    results = []
    for i, row in enumerate(rows):
        result = predict_single(row, model_name)
        results.append({
            "row": i + 1,
            "prediction": result["prediction"],
            "label": result["label"],
            "confidence": result["confidence"],
        })
    return results
