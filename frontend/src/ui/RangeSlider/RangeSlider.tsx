import { useId } from "react";
import * as RadixSlider from "@radix-ui/react-slider";
import styles from "./RangeSlider.module.css";

export interface RangeSliderProps {
  readonly min: number;
  readonly max: number;
  readonly step?: number;
  readonly value: readonly [number, number];
  readonly onValueChange: (value: readonly [number, number]) => void;
  readonly label: string;
  readonly formatValue?: (value: number) => string;
  readonly minLabel?: string;
  readonly maxLabel?: string;
}

const identityFormat = (n: number): string => String(n);

export function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onValueChange,
  label,
  formatValue = identityFormat,
  minLabel = "Mínimo",
  maxLabel = "Máximo",
}: RangeSliderProps) {
  const labelId = useId();
  const [low, high] = value;
  const display = `${formatValue(low)} – ${formatValue(high)}`;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span id={labelId} className={styles.label}>
          {label}
        </span>
        <span className={styles.value} aria-live="polite">
          {display}
        </span>
      </div>
      <RadixSlider.Root
        className={styles.root}
        min={min}
        max={max}
        step={step}
        value={[low, high]}
        onValueChange={(next) => onValueChange([next[0], next[1]] as const)}
        minStepsBetweenThumbs={0}
        aria-labelledby={labelId}
      >
        <RadixSlider.Track className={styles.track}>
          <RadixSlider.Range className={styles.range} />
        </RadixSlider.Track>
        <RadixSlider.Thumb
          className={styles.thumb}
          aria-label={minLabel}
          aria-valuetext={formatValue(low)}
        />
        <RadixSlider.Thumb
          className={styles.thumb}
          aria-label={maxLabel}
          aria-valuetext={formatValue(high)}
        />
      </RadixSlider.Root>
    </div>
  );
}
