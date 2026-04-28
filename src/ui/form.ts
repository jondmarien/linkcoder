import { cx } from "./class";

export const inputClass = (className?: string) =>
  cx(
    "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
    className,
  );

export const labelClass = (className?: string) =>
  cx("flex items-center gap-2 text-sm font-medium leading-none", className);

export const fieldClass = (className?: string) => cx("grid gap-2", className);

export const selectClass = (className?: string) =>
  cx(
    "h-9 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30",
    className,
  );
