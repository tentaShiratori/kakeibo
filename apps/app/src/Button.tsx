import type { ButtonHTMLAttributes } from "react";

const variants = {
  primary:
    "rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50",
  ghost: "text-sm underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline",
} as const;

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return (
    <button
      {...props}
      className={[
        "cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
        variants[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      type={type}
    />
  );
}
