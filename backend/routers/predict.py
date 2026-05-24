"""Prediction router for /api/predict/*."""
import csv
import io

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel

from ml.pipeline import predict_single, predict_batch

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
        text = contents.decode("utf-8-sig")
        rows = list(csv.DictReader(io.StringIO(text)))
        results = predict_batch(rows, model)
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
