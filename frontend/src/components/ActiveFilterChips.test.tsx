import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActiveFilterChips } from "./ActiveFilterChips";

const noop = () => undefined;

const PLAYER_BOUNDS = [1, 12] as const;

const DEFAULTS = {
  search: "",
  filter: "all" as const,
  location: "all" as const,
  timePreset: "all" as const,
  minRating: 0,
  playerRange: PLAYER_BOUNDS,
  playerBounds: PLAYER_BOUNDS,
  onClearSearch: noop,
  onClearFilter: noop,
  onClearLocation: noop,
  onClearTimePreset: noop,
  onClearMinRating: noop,
  onClearPlayerRange: noop,
};

describe("ActiveFilterChips", () => {
  it("renders nothing when every filter is at its default value", () => {
    const { container } = render(<ActiveFilterChips {...DEFAULTS} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders one chip per non-default value with the expected label", () => {
    render(
      <ActiveFilterChips
        {...DEFAULTS}
        filter="available"
        playerRange={[2, 4]}
        timePreset="30to60"
      />,
    );
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(screen.getByText("Disponibles")).toBeInTheDocument();
    expect(screen.getByText("2–4 jugadores")).toBeInTheDocument();
    expect(screen.getByText("30–60 min")).toBeInTheDocument();
  });

  it("renders the search chip with the trimmed query", () => {
    render(<ActiveFilterChips {...DEFAULTS} search="  Catan  " />);
    expect(screen.getByText('Buscar: "Catan"')).toBeInTheDocument();
  });

  it("renders the location chip with Armario / Sótano labels", () => {
    const { rerender } = render(
      <ActiveFilterChips {...DEFAULTS} location="armari" />,
    );
    expect(screen.getByText("Armario")).toBeInTheDocument();
    rerender(<ActiveFilterChips {...DEFAULTS} location="soterrani" />);
    expect(screen.getByText("Sótano")).toBeInTheDocument();
  });

  it("renders the rating chip with one decimal place and the star glyph", () => {
    render(<ActiveFilterChips {...DEFAULTS} minRating={7.5} />);
    expect(screen.getByText("≥ 7.5 ★")).toBeInTheDocument();
  });

  it('renders the upper player bound as "12+" when at the maximum', () => {
    render(
      <ActiveFilterChips {...DEFAULTS} playerRange={[6, 12]} />,
    );
    expect(screen.getByText("6–12+ jugadores")).toBeInTheDocument();
  });

  it("calls the matching onClear callback when a chip's close button is clicked", async () => {
    const onClearFilter = vi.fn();
    const onClearPlayerRange = vi.fn();
    render(
      <ActiveFilterChips
        {...DEFAULTS}
        filter="available"
        playerRange={[2, 4]}
        onClearFilter={onClearFilter}
        onClearPlayerRange={onClearPlayerRange}
      />,
    );
    const removeButtons = screen.getAllByRole("button", {
      name: "Quitar filtro",
    });
    expect(removeButtons).toHaveLength(2);
    await userEvent.click(removeButtons[0]);
    expect(onClearFilter).toHaveBeenCalledTimes(1);
    expect(onClearPlayerRange).toHaveBeenCalledTimes(0);
    await userEvent.click(removeButtons[1]);
    expect(onClearPlayerRange).toHaveBeenCalledTimes(1);
  });
});
