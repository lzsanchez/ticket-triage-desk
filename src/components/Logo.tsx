interface LogoProps {
  size?: "hero" | "header" | "compact";
  className?: string;
}

const SIZE: Record<NonNullable<LogoProps["size"]>, string> = {
  hero: "text-[100px]",
  header: "text-[44px]",
  compact: "text-[28px]",
};

export function Logo({ size = "header", className = "" }: LogoProps) {
  return (
    <span
      className={`inline-flex items-baseline font-extrabold leading-none tracking-tight ${SIZE[size]} ${className}`}
      style={{ letterSpacing: "-0.02em" }}
    >
      <span className="text-[#1e3a8a] dark:text-white">ctrl</span>
      <span style={{ color: "#06b6d4" }}>+desk</span>
    </span>
  );
}
