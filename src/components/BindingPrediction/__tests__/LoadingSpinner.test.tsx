import { render, screen } from "@testing-library/react";
import LoadingSpinner from "../LoadingSpinner";

describe("LoadingSpinner", () => {
  it("renders default message 'processing prediction...'", () => {
    render(<LoadingSpinner />);

    expect(screen.getByText("processing prediction...")).toBeInTheDocument();
  });

  it("renders custom message when provided", () => {
    render(<LoadingSpinner message="loading protein data..." />);

    expect(screen.getByText("loading protein data...")).toBeInTheDocument();
    expect(
      screen.queryByText("processing prediction...")
    ).not.toBeInTheDocument();
  });

  it("hides message when empty string is passed", () => {
    const { container } = render(<LoadingSpinner message="" />);

    // the spinner element should still be present
    const spinnerDiv = container.querySelector(".animate-spin");
    expect(spinnerDiv).toBeInTheDocument();

    // no <p> tag should be rendered for message
    const paragraphs = container.querySelectorAll("p");
    expect(paragraphs.length).toBe(0);
  });

  it("renders different sizes", () => {
    const { rerender, container } = render(<LoadingSpinner size="sm" />);
    expect(container.querySelector(".h-6")).toBeInTheDocument();

    rerender(<LoadingSpinner size="lg" />);
    expect(container.querySelector(".h-16")).toBeInTheDocument();
  });
});
