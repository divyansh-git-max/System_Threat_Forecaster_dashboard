"""Metrics router — /api/metrics, /api/models, /api/feature-importance, /api/stats"""
from fastapi import APIRouter
from ml.features import MODEL_METRICS, FEATURE_IMPORTANCES, FEATURES

router = APIRouter(prefix="/api", tags=["metrics"])


@router.get("/models")
def get_models():
    return {
        "models": list(MODEL_METRICS.keys()),
        "default": "XGBoost",
    }


@router.get("/metrics")
def get_metrics():
    result = []
    for name, m in MODEL_METRICS.items():
        result.append({
            "model": name,
            "accuracy": m["accuracy"],
            "precision_0": m["precision"]["0"],
            "precision_1": m["precision"]["1"],
            "recall_0": m["recall"]["0"],
            "recall_1": m["recall"]["1"],
            "f1_0": m["f1"]["0"],
            "f1_1": m["f1"]["1"],
            "color": m["color"],
        })
    return {"metrics": result}


@router.get("/feature-importance")
def get_feature_importance():
    return {"importances": FEATURE_IMPORTANCES}


@router.get("/features")
def get_features():
    return {"features": FEATURES}


@router.get("/stats")
def get_stats():
    return {
        "dataset": "Microsoft Malware Prediction (Kaggle)",
        "training_samples": 8_910_000,
        "test_samples": 7_853_253,
        "features_total": 83,
        "features_used": len(FEATURES),
        "target": "HasDetections",
        "classes": ["No Threat (0)", "Threat Detected (1)"],
        "class_balance": {"0": 0.494, "1": 0.506},
        "best_model": "XGBoost / Stacking Classifier",
        "best_accuracy": 0.63,
    }
