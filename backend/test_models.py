"""
unit tests for pydantic models (models.py)
validates schema construction, defaults, and required field enforcement
"""

import pytest
from pydantic import ValidationError
from models import (
    ChemicalProperties,
    PredictionRequest,
    BindingSite,
    PredictionDetails,
    PredictionResponse,
    ErrorResponse,
    HealthResponse,
)


class TestChemicalProperties:
    """tests for ChemicalProperties model"""

    def test_all_fields_optional(self):
        props = ChemicalProperties()
        assert props.molecular_weight is None
        assert props.isoelectric_point is None
        assert props.hydrophobicity is None

    def test_with_all_fields(self):
        props = ChemicalProperties(
            molecular_weight=55000.0,
            isoelectric_point=7.4,
            hydrophobicity=0.65,
        )
        assert props.molecular_weight == 55000.0
        assert props.isoelectric_point == 7.4
        assert props.hydrophobicity == 0.65

    def test_partial_fields(self):
        props = ChemicalProperties(molecular_weight=12345.0)
        assert props.molecular_weight == 12345.0
        assert props.isoelectric_point is None


class TestPredictionRequest:
    """tests for PredictionRequest model"""

    def test_valid_request_minimal(self):
        req = PredictionRequest(amino_acid_sequence="MVLSPADKTNVKAAW")
        assert req.amino_acid_sequence == "MVLSPADKTNVKAAW"
        assert req.pdb_data is None
        assert req.chemical_properties is None

    def test_valid_request_full(self):
        req = PredictionRequest(
            amino_acid_sequence="MVLSPADKTNVKAAW",
            pdb_data="ATOM      1  N   ALA A   1",
            chemical_properties=ChemicalProperties(molecular_weight=55000.0),
        )
        assert req.pdb_data is not None
        assert req.chemical_properties.molecular_weight == 55000.0

    def test_missing_required_sequence(self):
        with pytest.raises(ValidationError):
            PredictionRequest()


class TestBindingSite:
    """tests for BindingSite model"""

    def test_valid_binding_site(self):
        site = BindingSite(residue="arg-16", contribution=0.30)
        assert site.residue == "arg-16"
        assert site.contribution == 0.30

    def test_missing_residue(self):
        with pytest.raises(ValidationError):
            BindingSite(contribution=0.30)

    def test_missing_contribution(self):
        with pytest.raises(ValidationError):
            BindingSite(residue="lys-31")


class TestPredictionDetails:
    """tests for PredictionDetails model"""

    def test_valid_prediction_details(self):
        details = PredictionDetails(
            binding_affinity=-8.5,
            confidence_score=0.85,
            interaction_type="hydrogen bonding",
            binding_sites=[
                BindingSite(residue="arg-16", contribution=0.30),
            ],
        )
        assert details.binding_affinity == -8.5
        assert details.unit == "kcal/mol"  # default value
        assert details.confidence_score == 0.85
        assert len(details.binding_sites) == 1

    def test_default_unit(self):
        details = PredictionDetails(
            binding_affinity=-7.0,
            confidence_score=0.6,
            interaction_type="hydrophobic interaction",
        )
        assert details.unit == "kcal/mol"

    def test_default_empty_binding_sites(self):
        details = PredictionDetails(
            binding_affinity=-7.0,
            confidence_score=0.6,
            interaction_type="ionic bonding",
        )
        assert details.binding_sites == []


class TestPredictionResponse:
    """tests for PredictionResponse model"""

    def test_successful_response(self):
        prediction = PredictionDetails(
            binding_affinity=-9.0,
            confidence_score=0.90,
            interaction_type="pi-pi stacking",
        )
        response = PredictionResponse(prediction=prediction)
        assert response.success is True
        assert response.prediction.binding_affinity == -9.0


class TestErrorResponse:
    """tests for ErrorResponse model"""

    def test_error_response(self):
        err = ErrorResponse(error="prediction failed", code="PRED_500")
        assert err.success is False
        assert err.error == "prediction failed"
        assert err.code == "PRED_500"


class TestHealthResponse:
    """tests for HealthResponse model"""

    def test_default_health_response(self):
        health = HealthResponse()
        assert health.status == "healthy"
        assert health.message == "fastapi backend is running"

    def test_custom_health_response(self):
        health = HealthResponse(status="degraded", message="high load")
        assert health.status == "degraded"
        assert health.message == "high load"
