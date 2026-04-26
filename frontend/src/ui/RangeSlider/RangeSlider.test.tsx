import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RangeSlider } from "./RangeSlider";

function ControlledRangeSlider({
  initial = [2, 6] as readonly [number, number],
  formatValue,
}: {
  readonly initial?: readonly [number, number];
  readonly formatValue?: (n: number) => string;
}) {
  const [value, setValue] = useState<readonly [number, number]>(initial);
  return (
    <RangeSlider
      label="Jugadores"
      min={1}
      max={12}
      value={value}
      onValueChange={setValue}
      formatValue={formatValue}
      minLabel="Mínimo"
      maxLabel="Máximo"
    />
  );
}

describe("RangeSlider", () => {
  it("renders the label and the formatted current range", () => {
    render(<ControlledRangeSlider initial={[2, 6]} />);
    expect(screen.getByText("Jugadores")).toBeInTheDocument();
    expect(screen.getByText("2 – 6")).toBeInTheDocument();
  });

  it("uses formatValue for the displayed range and aria-valuetext", () => {
    render(
      <ControlledRangeSlider
        initial={[1, 12]}
        formatValue={(n) => (n >= 12 ? "12+" : String(n))}
      />,
    );
    expect(screen.getByText("1 – 12+")).toBeInTheDocument();
    const max = screen.getByRole("slider", { name: "Máximo" });
    expect(max).toHaveAttribute("aria-valuetext", "12+");
  });

  it("exposes both thumbs with correct ARIA min/max/now and named labels", () => {
    render(<ControlledRangeSlider initial={[2, 6]} />);
    const min = screen.getByRole("slider", { name: "Mínimo" });
    const max = screen.getByRole("slider", { name: "Máximo" });
    expect(min).toHaveAttribute("aria-valuemin", "1");
    expect(min).toHaveAttribute("aria-valuemax", "12");
    expect(min).toHaveAttribute("aria-valuenow", "2");
    expect(max).toHaveAttribute("aria-valuemin", "1");
    expect(max).toHaveAttribute("aria-valuemax", "12");
    expect(max).toHaveAttribute("aria-valuenow", "6");
  });

  it("calls onValueChange with the expected tuple when arrow keys advance a thumb", async () => {
    const handleChange = vi.fn();
    render(
      <RangeSlider
        label="Jugadores"
        min={1}
        max={12}
        value={[2, 6]}
        onValueChange={handleChange}
      />,
    );
    const min = screen.getByRole("slider", { name: "Mínimo" });
    min.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(handleChange).toHaveBeenCalledWith([3, 6]);
  });

  it("Home key moves the focused handle to its lower extreme", async () => {
    render(<ControlledRangeSlider initial={[5, 8]} />);
    const min = screen.getByRole("slider", { name: "Mínimo" });
    min.focus();
    await userEvent.keyboard("{Home}");
    expect(screen.getByText("1 – 8")).toBeInTheDocument();
  });

  it("End key moves the focused handle to its upper extreme", async () => {
    render(<ControlledRangeSlider initial={[3, 6]} />);
    const max = screen.getByRole("slider", { name: "Máximo" });
    max.focus();
    await userEvent.keyboard("{End}");
    expect(screen.getByText("3 – 12")).toBeInTheDocument();
  });
});
