"""Prediction router — /api/predict/*"""
import io
import pandas as pd
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel

from ml.pipeline import predict_single, predict_batch
from ml.features import FEATURE_NAMES

router = APIRouter(prefix="/api/predict", tags=["predict"])


class SinglePredictRequest(BaseModel):
    features: dict
    model: str = "XGBoost"


@router.post("/single")
def single_predict(req: SinglePredictRequest):
    try:
        result = predict_single(req.features, req.model)
        return {"success": True, "data": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {e}")


@router.post("/batch")
async def batch_predict(
    file: UploadFile = File(...),
    model: str = "XGBoost",
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        results = predict_batch(df, model)
        threat_count = sum(1 for r in results if r["prediction"] == 1)
        return {
            "success": True,
            "total": len(results),
            "threats": threat_count,
            "safe": len(results) - threat_count,
            "threat_rate": round(threat_count / len(results), 4) if results else 0,
            "results": results,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch prediction error: {e}")
