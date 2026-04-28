import { cx } from "./class";

export const cardClass = (className?: string) =>
  cx(
    "rounded-xl border bg-card py-6 text-card-foreground shadow-sm",
    className,
  );

export const cardHeaderClass = (className?: string) =>
  cx("grid gap-2 px-6", className);

export const cardTitleClass = (className?: string) =>
  cx("font-semibold leading-none", className);

export const cardDescriptionClass = (className?: string) =>
  cx("text-sm text-muted-foreground", className);

export const cardContentClass = (className?: string) => cx("px-6", className);
