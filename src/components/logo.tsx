import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="ORION Home"
      className={`flex items-center gap-2 text-lg font-semibold tracking-tight text-[#F9FAFB] ${className}`}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#00FF88]">
        <span className="h-2.5 w-2.5 rounded-sm bg-[#030712]" />
      </span>
      ORION
    </Link>
  );
}