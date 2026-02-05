"""
fastapi backend for protein binding prediction
provides ml prediction endpoints with mock model implementation
all responses use lowercase text as per project requirements
"""

import asyncio
import random
import hashlib
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from models import (
    PredictionRequest,
    PredictionResponse,
    PredictionDetails,
    BindingSite,
    ErrorResponse,
    HealthResponse,
)

# initialize fastapi application
app = FastAPI(
    title="protein binding prediction api",
    description="ml-powered protein binding affinity prediction service",
    version="1.0.0",
)

# configure cors for cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# timeout configuration (30 seconds)
PREDICTION_TIMEOUT = 30


def calculate_mock_binding_affinity(sequence: str) -> float:
    """
    mock function to calculate binding affinity based on sequence
    in production, replace with actual ml model (e.g., esm-2, gnina)
    """
    # use sequence hash for reproducible results
    sequence_hash = int(hashlib.md5(sequence.encode()).hexdigest(), 16)
    # generate binding affinity between -12 and -4 kcal/mol (typical range)
    base_affinity = -8.0
    variation = (sequence_hash % 80) / 10 - 4  # range: -4 to +4
    return round(base_affinity + variation, 2)


def calculate_mock_confidence(sequence: str, has_pdb: bool, has_properties: bool) -> float:
    """
    mock function to calculate confidence score
    higher confidence with more input data
    """
    base_confidence = 0.65
    if has_pdb:
        base_confidence += 0.15
    if has_properties:
        base_confidence += 0.10
    # add some variation based on sequence length
    length_bonus = min(len(sequence) / 1000, 0.10)
    return round(min(base_confidence + length_bonus, 0.98), 2)


def get_mock_interaction_type(sequence: str) -> str:
    """
    mock function to determine interaction type
    in production, this would be predicted by the ml model
    """
    interaction_types = [
        "hydrogen bonding",
        "hydrophobic interaction",
        "ionic bonding",
        "van der waals forces",
        "pi-pi stacking",
    ]
    # deterministic selection based on sequence
    index = len(sequence) % len(interaction_types)
    return interaction_types[index]


def get_mock_binding_sites(sequence: str) -> list:
    """
    mock function to identify binding sites
    generates realistic-looking residue identifiers
    """
    amino_acids = ["arg", "lys", "glu", "asp", "his", "ser", "thr", "asn", "gln", "cys"]
    num_sites = min(5, max(2, len(sequence) // 50))
    sites = []
    
    for i in range(num_sites):
        residue_pos = (i + 1) * 15 + (len(sequence) % 20)
        aa = amino_acids[i % len(amino_acids)]
        contribution = round(0.30 - (i * 0.05) + random.uniform(-0.05, 0.05), 2)
        sites.append(BindingSite(
            residue=f"{aa}-{residue_pos}",
            contribution=max(0.05, contribution)
        ))
    
    return sites


async def run_prediction(request: PredictionRequest) -> PredictionDetails:
    """
    run the mock prediction model
    in production, replace with actual ml model inference
    """
    # simulate processing time (1-3 seconds)
    processing_time = random.uniform(1.0, 3.0)
    await asyncio.sleep(processing_time)
    
    # calculate mock predictions
    binding_affinity = calculate_mock_binding_affinity(request.amino_acid_sequence)
    confidence_score = calculate_mock_confidence(
        request.amino_acid_sequence,
        request.pdb_data is not None,
        request.chemical_properties is not None
    )
    interaction_type = get_mock_interaction_type(request.amino_acid_sequence)
    binding_sites = get_mock_binding_sites(request.amino_acid_sequence)
    
    return PredictionDetails(
        binding_affinity=binding_affinity,
        unit="kcal/mol",
        confidence_score=confidence_score,
        interaction_type=interaction_type,
        binding_sites=binding_sites
    )


@app.post("/predict", response_model=PredictionResponse)
async def predict_binding(request: PredictionRequest):
    """
    predict protein binding affinity
    
    accepts amino acid sequence and optional pdb data/chemical properties
    returns binding affinity, confidence score, and interaction details
    """
    # validate sequence
    if not request.amino_acid_sequence or len(request.amino_acid_sequence) < 10:
        raise HTTPException(
            status_code=400,
            detail={
                "success": False,
                "error": "amino acid sequence must be at least 10 characters",
                "code": "invalid_sequence"
            }
        )
    
    try:
        # run prediction with timeout
        prediction = await asyncio.wait_for(
            run_prediction(request),
            timeout=PREDICTION_TIMEOUT
        )
        
        return PredictionResponse(
            success=True,
            prediction=prediction
        )
        
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=408,
            detail={
                "success": False,
                "error": "request timed out. please try again.",
                "code": "timeout"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "prediction failed. please try again.",
                "code": "prediction_error"
            }
        )


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    health check endpoint
    returns current status of the backend service
    """
    return HealthResponse(
        status="healthy",
        message="fastapi backend is running"
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """custom exception handler for consistent error responses"""
    if isinstance(exc.detail, dict):
        return JSONResponse(
            status_code=exc.status_code,
            content=exc.detail
        )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": str(exc.detail),
            "code": "error"
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
