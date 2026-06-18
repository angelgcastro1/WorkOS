/* eslint-disable @next/next/no-img-element -- static SVG brand logo; next/image adds no value here and complicates print/PDF rendering */

const RATIO = 438.13 / 402.07;

type BrandMarkProps = {
  height?: number;
  className?: string;
};

export function BrandMark({ height = 40, className = "" }: BrandMarkProps) {
  const width = Math.round(height * RATIO);
  return (
    <img
      src="/cham-media.svg"
      alt="Cham Media"
      width={width}
      height={height}
      className={`rounded-lg ${className}`}
    />
  );
}
