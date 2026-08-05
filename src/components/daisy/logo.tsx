import { cn } from "@/lib/utils";

/**
 * The daisy mark. Inlined rather than loaded from `/asset/daisy-logo.svg` so
 * it inherits `currentColor` — the same mark has to sit on the light header,
 * the dark one, and on top of the hero photograph without three copies.
 */
export function DaisyMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 7566 7652"
      fill="currentColor"
      aria-hidden
      className={cn("size-6 shrink-0", className)}
    >
      <g transform="matrix(5.72917,0,0,5.72917,0,0)">
        <g transform="matrix(0.813713,0.218034,-0.218034,0.813713,-487.937,-1023.44)">
          <path d="M1635.82,1113.29C1635.82,991.384 1734.8,892.412 1856.7,892.412C1978.61,892.412 2077.58,991.384 2077.58,1113.29C2172.89,1037.28 2311.98,1052.95 2387.99,1148.27C2463.99,1243.58 2448.32,1382.66 2353.01,1458.67C2471.86,1485.8 2546.33,1604.31 2519.2,1723.16C2492.08,1842.01 2373.56,1916.48 2254.71,1889.35C2307.61,1999.19 2261.38,2131.3 2151.54,2184.19C2041.71,2237.09 1909.59,2190.86 1856.7,2081.03C1803.81,2190.86 1671.69,2237.09 1561.86,2184.19C1452.03,2131.3 1405.8,1999.19 1458.69,1889.35C1339.84,1916.48 1221.33,1842.01 1194.2,1723.16C1167.07,1604.31 1241.54,1485.8 1360.39,1458.67C1265.08,1382.66 1249.41,1243.58 1325.42,1148.27C1401.42,1052.95 1540.51,1037.28 1635.82,1113.29ZM1796.6,1382.85C1694.14,1410.31 1633.25,1515.77 1660.7,1618.22C1688.16,1720.67 1793.62,1781.57 1896.07,1754.11C1998.53,1726.66 2059.42,1621.19 2031.96,1518.74C2004.51,1416.29 1899.05,1355.4 1796.6,1382.85Z" />
        </g>
      </g>
    </svg>
  );
}

/**
 * Mark plus wordmark. The mark alone is a flower — legible as a logo only once
 * people already know the brand, which nobody does yet, so the name rides
 * along until it does.
 */
export function Logo({
  className,
  markClassName,
  accentClassName = "text-primary",
}: {
  className?: string;
  markClassName?: string;
  /** The `.work` tint, which differs between the marketing and app shells. */
  accentClassName?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold tracking-tight",
        className,
      )}
    >
      <DaisyMark className={markClassName} />
      <span>
        Daisy<span className={accentClassName}>.work</span>
      </span>
    </span>
  );
}
