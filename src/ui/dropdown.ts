import { cx } from "./class";

export const dropdownClass = (className?: string) =>
  cx(
    "rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
    className,
  );

export const dropdownItemClass = (className?: string) =>
  cx(
    "flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
    className,
  );
