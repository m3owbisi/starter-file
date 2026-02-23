import { render, screen } from "@testing-library/react";
import MetricsCard from "../MetricsCard";

describe("MetricsCard", () => {
  const defaultProps = {
    title: "total experiments",
    value: "150",
    icon: <span data-testid="metric-icon">icon</span>,
  };

  it("renders title, value, and icon", () => {
    render(<MetricsCard {...defaultProps} />);

    expect(screen.getByText(/total experiments/i)).toBeInTheDocument();
    expect(screen.getByText(/150/i)).toBeInTheDocument();
    expect(screen.getByTestId("metric-icon")).toBeInTheDocument();
  });

  it("renders numeric value correctly", () => {
    render(<MetricsCard {...defaultProps} value={42} />);

    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("shows loading skeleton when loading is true", () => {
    const { container } = render(
      <MetricsCard {...defaultProps} loading={true} />
    );

    // loading state should show the animate-pulse skeleton
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("animate-pulse");

    // actual content should NOT be present
    expect(screen.queryByText(/total experiments/i)).not.toBeInTheDocument();
  });

  it("renders positive trend indicator", () => {
    render(<MetricsCard {...defaultProps} trend={12} trendLabel="vs last week" />);

    expect(screen.getByText("12%")).toBeInTheDocument();
    expect(screen.getByText("vs last week")).toBeInTheDocument();
  });

  it("renders negative trend indicator", () => {
    render(<MetricsCard {...defaultProps} trend={-5} />);

    expect(screen.getByText("5%")).toBeInTheDocument();
  });

  it("renders zero trend (neutral)", () => {
    render(<MetricsCard {...defaultProps} trend={0} />);

    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("renders subtitle text", () => {
    render(<MetricsCard {...defaultProps} subtitle="this month" />);

    expect(screen.getByText("this month")).toBeInTheDocument();
  });

  it("does not render trend section when trend is undefined", () => {
    render(<MetricsCard {...defaultProps} />);

    // no percentage text should be present
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });
});
