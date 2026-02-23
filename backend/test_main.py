"""
unit tests for fastapi backend (main.py)
covers mock prediction functions and api endpoints
"""

import pytest
from httpx import AsyncClient, ASGITransport
from main import (
    app,
    calculate_mock_binding_affinity,
    calculate_mock_confidence,
    get_mock_interaction_type,
    get_mock_binding_sites,
)


# ---------------------------------------------------------------------------
# unit tests for pure functions
# ---------------------------------------------------------------------------

class TestCalculateMockBindingAffinity:
    """tests for calculate_mock_binding_affinity"""

    def test_returns_float(self):
        result = calculate_mock_binding_affinity("MVLSPADKTNVKAAW")
        assert isinstance(result, float)

    def test_result_in_expected_range(self):
        # typical binding affinity range: -12 to -4 kcal/mol
        result = calculate_mock_binding_affinity("MVLSPADKTNVKAAW")
        assert -12.0 <= result <= -4.0

    def test_deterministic_for_same_input(self):
        r1 = calculate_mock_binding_affinity("ACDEFGHIKLMNPQRSTVWY")
        r2 = calculate_mock_binding_affinity("ACDEFGHIKLMNPQRSTVWY")
        assert r1 == r2

    def test_different_sequences_can_differ(self):
        r1 = calculate_mock_binding_affinity("AAAA" * 10)
        r2 = calculate_mock_binding_affinity("WWWW" * 10)
        # they may happen to be equal, but usually differ
        # just verify they're both valid
        assert -12.0 <= r1 <= -4.0
        assert -12.0 <= r2 <= -4.0


class TestCalculateMockConfidence:
    """tests for calculate_mock_confidence"""

    def test_base_confidence(self):
        result = calculate_mock_confidence("MVLSPADKTNVKAAW", False, False)
        assert result >= 0.65
        assert result <= 0.98

    def test_pdb_bonus(self):
        without = calculate_mock_confidence("MVLSPADKTNVKAAW", False, False)
        with_pdb = calculate_mock_confidence("MVLSPADKTNVKAAW", True, False)
        assert with_pdb > without

    def test_properties_bonus(self):
        without = calculate_mock_confidence("MVLSPADKTNVKAAW", False, False)
        with_props = calculate_mock_confidence("MVLSPADKTNVKAAW", False, True)
        assert with_props > without

    def test_capped_at_098(self):
        # long sequence + all bonuses should still be <= 0.98
        long_seq = "A" * 5000
        result = calculate_mock_confidence(long_seq, True, True)
        assert result <= 0.98


class TestGetMockInteractionType:
    """tests for get_mock_interaction_type"""

    VALID_TYPES = [
        "hydrogen bonding",
        "hydrophobic interaction",
        "ionic bonding",
        "van der waals forces",
        "pi-pi stacking",
    ]

    def test_returns_valid_type(self):
        result = get_mock_interaction_type("MVLSPADKTNVKAAW")
        assert result in self.VALID_TYPES

    def test_deterministic(self):
        r1 = get_mock_interaction_type("ACDEFGHIKLMNPQRSTVWY")
        r2 = get_mock_interaction_type("ACDEFGHIKLMNPQRSTVWY")
        assert r1 == r2


class TestGetMockBindingSites:
    """tests for get_mock_binding_sites"""

    def test_returns_correct_number_of_sites(self):
        # short sequence -> min 2 sites
        sites = get_mock_binding_sites("MVLSPADKTNVKAAW")
        assert len(sites) >= 2
        assert len(sites) <= 5

    def test_site_has_residue_and_contribution(self):
        sites = get_mock_binding_sites("MVLSPADKTNVKAAW" * 10)
        for site in sites:
            assert site.residue  # non-empty string
            assert site.contribution >= 0.05

    def test_longer_sequence_more_sites(self):
        short = get_mock_binding_sites("A" * 50)
        long = get_mock_binding_sites("A" * 300)
        assert len(long) >= len(short)


# ---------------------------------------------------------------------------
# integration tests for api endpoints
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
class TestPredictEndpoint:
    """tests for POST /predict"""

    async def test_valid_prediction(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/predict",
                json={"amino_acid_sequence": "MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSH"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "prediction" in data
        assert "binding_affinity" in data["prediction"]
        assert "confidence_score" in data["prediction"]
        assert "interaction_type" in data["prediction"]

    async def test_short_sequence_returns_400(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/predict",
                json={"amino_acid_sequence": "ABC"},
            )

        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False

    async def test_empty_sequence_returns_400(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/predict",
                json={"amino_acid_sequence": ""},
            )

        assert response.status_code == 400


@pytest.mark.asyncio
class TestHealthEndpoint:
    """tests for GET /health"""

    async def test_health_check(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["message"] == "fastapi backend is running"
