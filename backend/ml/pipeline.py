"""
ML Pipeline — trains models on synthetic data (mirrors the notebook pipeline)
and exposes predict / batch-predict methods.
"""
import os
import tempfile
from threading import Lock
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import (
    RandomForestClassifier,
    GradientBoostingClassifier,
    VotingClassifier,
    StackingClassifier,
)
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier

from ml.features import FEATURE_NAMES, FEATURES

MODEL_DIR = os.getenv(
    "MODEL_DIR",
    os.path.join(tempfile.gettempdir(), "system-threat-models")
    if os.getenv("VERCEL") == "1"
    else os.path.join(os.path.dirname(__file__), "..", "models"),
)
os.makedirs(MODEL_DIR, exist_ok=True)
MODEL_PATH = os.path.join(MODEL_DIR, "pipeline.pkl")


def _is_serverless() -> bool:
    return os.getenv("VERCEL") == "1"


def _training_sample_count() -> int:
    default = 1000
    return int(os.getenv("MODEL_TRAINING_SAMPLES", default))

# ── Synthetic data generation ─────────────────────────────────────────────────

def _make_synthetic_data(n: int = 8000, seed: int = 42) -> pd.DataFrame:
    """Generate a synthetic dataset that mimics the notebook's feature space."""
    rng = np.random.default_rng(seed)

    data: dict = {}
    for feat in FEATURES:
        name = feat["name"]
        ftype = feat["type"]
        if ftype == "bool":
            data[name] = rng.integers(0, 2, size=n).astype(float)
        elif ftype == "int":
            lo, hi = feat.get("min", 0), feat.get("max", 100)
            data[name] = rng.integers(lo, hi + 1, size=n).astype(float)
        elif ftype == "float":
            lo, hi = feat.get("min", 0.0), feat.get("max", 100.0)
            data[name] = rng.uniform(lo, hi, size=n)
        elif ftype == "select":
            opts = feat.get("options", [""])
            idx = rng.integers(0, len(opts), size=n)
            data[name] = np.array(opts)[idx]

    df = pd.DataFrame(data)

    # Encode categorical columns
    for feat in FEATURES:
        if feat["type"] == "select":
            le = LabelEncoder()
            df[feat["name"]] = le.fit_transform(df[feat["name"]].astype(str))

    # Simulate HasDetections with mild correlations
    score = (
        -0.3 * df["Census_IsSecureBootEnabled"]
        + 0.25 * df["Wdft_IsGamer"]
        - 0.2 * df["Firewall"]
        + 0.15 * (df["Census_TotalPhysicalRAM"] < 4096).astype(float)
        + rng.standard_normal(n) * 0.8
    )
    df["HasDetections"] = (score > score.mean()).astype(int)
    return df


# ── Training ──────────────────────────────────────────────────────────────────

def _build_models():
    xgb_estimators = int(os.getenv("XGB_ESTIMATORS", "50"))
    rf_estimators = int(os.getenv("RF_ESTIMATORS", "50"))
    gbc_estimators = int(os.getenv("GBC_ESTIMATORS", "25"))

    xgb = XGBClassifier(
        subsample=0.8, n_estimators=xgb_estimators, min_child_weight=1,
        max_depth=5, learning_rate=0.1, gamma=0.1,
        colsample_bytree=0.8,
        eval_metric="logloss", random_state=42,
    )
    rfc = RandomForestClassifier(
        bootstrap=False, criterion="gini", max_depth=20,
        max_features="sqrt", min_samples_split=5,
        n_estimators=rf_estimators, random_state=42,
    )
    gbc = GradientBoostingClassifier(
        subsample=0.8, n_estimators=gbc_estimators, max_leaf_nodes=20,
        max_depth=4, learning_rate=0.1, random_state=42,
    )
    voting = VotingClassifier(
        estimators=[("XGB", xgb), ("RFC", rfc), ("GBC", gbc)],
        voting="hard", weights=[3, 2, 1],
    )
    stacking = StackingClassifier(
        estimators=[("XGB", xgb), ("RFC", rfc), ("GBC", gbc)],
        final_estimator=LogisticRegression(max_iter=10000, solver="saga"),
        stack_method="predict_proba", passthrough=False,
    )
    return {
        "XGBoost": xgb,
        "Random Forest": rfc,
        "Gradient Boosting": gbc,
        "Voting Classifier": voting,
        "Stacking Classifier": stacking,
    }


def train_and_save():
    df = _make_synthetic_data(n=_training_sample_count())
    X = df[FEATURE_NAMES]
    y = df["HasDetections"]

    models = _build_models()
    trained = {}
    for name, mdl in models.items():
        print(f"Training {name}...")
        mdl.fit(X, y)
        trained[name] = mdl

    joblib.dump(trained, MODEL_PATH)
    print(f"Models saved -> {MODEL_PATH}")
    return trained


def load_models():
    if os.path.exists(MODEL_PATH):
        return joblib.load(MODEL_PATH)
    return train_and_save()


# ── Singleton ─────────────────────────────────────────────────────────────────

_models: dict | None = None
_models_lock = Lock()


def get_models() -> dict:
    global _models
    if _models is None:
        with _models_lock:
            if _models is None:
                _models = load_models()
    return _models


# ── Inference helpers ─────────────────────────────────────────────────────────

def _preprocess(raw: dict) -> pd.DataFrame:
    """Convert raw dict → clean numeric DataFrame row."""
    row: dict = {}
    feat_map = {f["name"]: f for f in FEATURES}

    for name in FEATURE_NAMES:
        val = raw.get(name)
        ftype = feat_map[name]["type"]
        if ftype == "bool":
            row[name] = float(int(val)) if val is not None else 0.0
        elif ftype == "int":
            row[name] = float(int(val)) if val is not None else float(feat_map[name]["default"])
        elif ftype == "float":
            row[name] = float(val) if val is not None else float(feat_map[name]["default"])
        elif ftype == "select":
            opts = feat_map[name].get("options", [""])
            if val in opts:
                row[name] = float(opts.index(val))
            else:
                row[name] = 0.0

    return pd.DataFrame([row])[FEATURE_NAMES]


def predict_single(raw: dict, model_name: str = "XGBoost") -> dict:
    models = get_models()
    if model_name not in models:
        raise ValueError(f"Unknown model: {model_name}")
    mdl = models[model_name]
    X = _preprocess(raw)
    pred = int(mdl.predict(X)[0])
    # Get probability if available
    if hasattr(mdl, "predict_proba"):
        proba = mdl.predict_proba(X)[0]
        confidence = float(proba[pred])
    else:
        confidence = 0.65
    return {
        "prediction": pred,
        "label": "Threat Detected" if pred == 1 else "No Threat",
        "confidence": round(confidence, 4),
        "model": model_name,
    }


def predict_batch(df_raw: pd.DataFrame, model_name: str = "XGBoost") -> list[dict]:
    models = get_models()
    if model_name not in models:
        raise ValueError(f"Unknown model: {model_name}")
    mdl = models[model_name]

    # Fill missing columns with defaults
    feat_map = {f["name"]: f for f in FEATURES}
    for name in FEATURE_NAMES:
        if name not in df_raw.columns:
            df_raw[name] = feat_map[name]["default"]

    X = df_raw[FEATURE_NAMES].copy()

    # Encode select columns
    for feat in FEATURES:
        if feat["type"] == "select" and feat["name"] in X.columns:
            opts = feat.get("options", [""])
            X[feat["name"]] = X[feat["name"]].apply(
                lambda v: float(opts.index(str(v))) if str(v) in opts else 0.0
            )
        else:
            X[feat["name"]] = pd.to_numeric(X[feat["name"]], errors="coerce").fillna(0.0)

    preds = mdl.predict(X).tolist()
    probas = mdl.predict_proba(X)[:, 1].tolist() if hasattr(mdl, "predict_proba") else [0.65] * len(preds)

    results = []
    for i, (p, prob) in enumerate(zip(preds, probas)):
        results.append({
            "row": i + 1,
            "prediction": int(p),
            "label": "Threat Detected" if p == 1 else "No Threat",
            "confidence": round(prob if p == 1 else 1 - prob, 4),
        })
    return results
