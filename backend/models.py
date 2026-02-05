"""
pydantic models for prediction request/response validation
all text fields use lowercase only as per project requirements
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict


class ChemicalProperties(BaseModel):
    """chemical properties for binding prediction"""
    molecular_weight: Optional[float] = Field(None, description="molecular weight in daltons")
    isoelectric_point: Optional[float] = Field(None, description="isoelectric point (pi)")
    hydrophobicity: Optional[float] = Field(None, description="hydrophobicity index (0-1)")


class PredictionRequest(BaseModel):
    """request model for binding prediction"""
    amino_acid_sequence: str = Field(..., description="amino acid sequence string")
    pdb_data: Optional[str] = Field(None, description="optional pdb file content")
    chemical_properties: Optional[ChemicalProperties] = Field(None, description="optional chemical properties")


class BindingSite(BaseModel):
    """individual binding site contribution"""
    residue: str = Field(..., description="residue identifier")
    contribution: float = Field(..., description="contribution score (0-1)")


class PredictionDetails(BaseModel):
    """detailed prediction results"""
    binding_affinity: float = Field(..., description="binding affinity in kcal/mol")
    unit: str = Field(default="kcal/mol", description="unit of measurement")
    confidence_score: float = Field(..., description="confidence score (0-1)")
    interaction_type: str = Field(..., description="type of molecular interaction")
    binding_sites: List[BindingSite] = Field(default=[], description="list of binding sites")


class PredictionResponse(BaseModel):
    """response model for successful prediction"""
    success: bool = Field(default=True)
    prediction: PredictionDetails


class ErrorResponse(BaseModel):
    """response model for error cases"""
    success: bool = Field(default=False)
    error: str = Field(..., description="error message")
    code: str = Field(..., description="error code")


class HealthResponse(BaseModel):
    """response model for health check"""
    status: str = Field(default="healthy")
    message: str = Field(default="fastapi backend is running")
