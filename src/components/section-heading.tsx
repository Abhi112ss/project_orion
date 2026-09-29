/*src/components/section-heading.tsx*/
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
  titleClassName,
  descriptionClassName,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className
      )}
    >
      {eyebrow && (
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-[#00FF88]">
          {eyebrow}
        </span>
      )}
      <h2
        className={cn(
          "max-w-2xl text-3xl font-semibold tracking-tight text-[#F9FAFB] sm:text-4xl md:text-5xl",
          titleClassName
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "max-w-xl text-balance text-base text-[#9CA3AF] sm:text-lg",
            descriptionClassName
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}