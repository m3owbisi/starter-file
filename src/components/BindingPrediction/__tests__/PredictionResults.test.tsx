import { render, screen } from "@testing-library/react";
import PredictionResults from "../PredictionResults";

const mockPrediction = {
  binding_affinity: -8.5,
  unit: "kcal/mol",
  confidence_score: 0.85,
  interaction_type: "hydrogen bonding",
  binding_sites: [
    { residue: "arg-16", contribution: 0.3 },
    { residue: "lys-31", contribution: 0.25 },
  ],
};

describe("PredictionResults", () => {
  it("renders binding affinity value and unit", () => {
    render(<PredictionResults prediction={mockPrediction} />);

    expect(screen.getByText("-8.5")).toBeInTheDocument();
    expect(screen.getByText("kcal/mol")).toBeInTheDocument();
  });

  it("renders confidence score as percentage", () => {
    render(<PredictionResults prediction={mockPrediction} />);

    // 0.85 * 100 = 85.0%
    expect(screen.getByText("85.0%")).toBeInTheDocument();
  });

  it("renders interaction type", () => {
    render(<PredictionResults prediction={mockPrediction} />);

    expect(screen.getByText("hydrogen bonding")).toBeInTheDocument();
  });

  it("renders binding sites list", () => {
    render(<PredictionResults prediction={mockPrediction} />);

    expect(screen.getByText("arg-16")).toBeInTheDocument();
    expect(screen.getByText("lys-31")).toBeInTheDocument();
    expect(screen.getByText("30%")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();
  });

  it("shows 'high confidence' label for score >= 0.8", () => {
    render(
      <PredictionResults
        prediction={{ ...mockPrediction, confidence_score: 0.85 }}
      />
    );

    expect(screen.getByText("high confidence")).toBeInTheDocument();
  });

  it("shows 'moderate confidence' label for score >= 0.6", () => {
    render(
      <PredictionResults
        prediction={{ ...mockPrediction, confidence_score: 0.65 }}
      />
    );

    expect(screen.getByText("moderate confidence")).toBeInTheDocument();
  });

  it("shows 'low confidence' label for score >= 0.4", () => {
    render(
      <PredictionResults
        prediction={{ ...mockPrediction, confidence_score: 0.45 }}
      />
    );

    expect(screen.getByText("low confidence")).toBeInTheDocument();
  });

  it("shows 'very low confidence' label for score < 0.4", () => {
    render(
      <PredictionResults
        prediction={{ ...mockPrediction, confidence_score: 0.2 }}
      />
    );

    expect(screen.getByText("very low confidence")).toBeInTheDocument();
  });

  it("renders interpretation guide", () => {
    render(<PredictionResults prediction={mockPrediction} />);

    expect(screen.getByText("interpretation guide")).toBeInTheDocument();
  });

  it("handles empty binding sites array", () => {
    render(
      <PredictionResults
        prediction={{ ...mockPrediction, binding_sites: [] }}
      />
    );

    // binding sites heading should not appear
    expect(
      screen.queryByText("predicted binding sites")
    ).not.toBeInTheDocument();
  });
});
