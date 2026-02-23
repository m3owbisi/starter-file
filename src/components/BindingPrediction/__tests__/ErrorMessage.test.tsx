import { render, screen, fireEvent } from "@testing-library/react";
import ErrorMessage from "../ErrorMessage";

describe("ErrorMessage", () => {
  it("renders the error message text", () => {
    render(<ErrorMessage message="something went wrong" />);

    expect(screen.getByText("something went wrong")).toBeInTheDocument();
  });

  it("renders error code when provided", () => {
    render(<ErrorMessage message="prediction failed" code="PRED_ERR_500" />);

    expect(screen.getByText("prediction failed")).toBeInTheDocument();
    expect(screen.getByText(/PRED_ERR_500/)).toBeInTheDocument();
  });

  it("does not render error code when not provided", () => {
    render(<ErrorMessage message="prediction failed" />);

    expect(screen.queryByText(/error code:/i)).not.toBeInTheDocument();
  });

  it("renders retry button when onRetry is provided", () => {
    const onRetry = jest.fn();
    render(<ErrorMessage message="failed" onRetry={onRetry} />);

    const retryButton = screen.getByText(/retry prediction/i);
    expect(retryButton).toBeInTheDocument();
  });

  it("does not render retry button when onRetry is absent", () => {
    render(<ErrorMessage message="failed" />);

    expect(screen.queryByText(/retry prediction/i)).not.toBeInTheDocument();
  });

  it("calls onRetry callback when retry button is clicked", () => {
    const onRetry = jest.fn();
    render(<ErrorMessage message="failed" onRetry={onRetry} />);

    fireEvent.click(screen.getByText(/retry prediction/i));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
