import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/site";

export function BrandLogo({
  to = "/site",
  variant = "horizontal",
  className,
}: {
  to?: "/site" | "/app" | "/";
  variant?: "horizontal" | "mark";
  className?: string;
}) {
  const src = variant === "mark" ? "/brand/mark.png" : "/brand/logo-horizontal.png";
  return (
    <Link to={to} className={cn("inline-flex items-center", className)} aria-label={SITE.name}>
      <img
        src={src}
        alt={SITE.name}
        className={cn("brand-logo w-auto object-contain", variant === "mark" ? "h-9" : "h-9 sm:h-10")}
      />
    </Link>
  );
}
