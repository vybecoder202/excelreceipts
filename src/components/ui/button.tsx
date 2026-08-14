import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-[background-color,color,border-color,box-shadow,opacity] duration-200 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none",
  {
    variants: {
      variant: {
        primary: "bg-blue-800 text-white shadow-sm hover:bg-blue-900 active:bg-blue-950",
        secondary:
          "border border-slate-300 bg-white text-slate-800 shadow-sm hover:border-blue-300 hover:bg-blue-50",
        ghost: "text-slate-700 hover:bg-slate-100 active:bg-slate-200",
        danger: "bg-red-700 text-white shadow-sm hover:bg-red-800",
      },
      size: {
        default: "h-11",
        compact: "h-10 min-h-10 px-3",
        icon: "size-11 px-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} type={type} {...props} />
  );
}

export { buttonVariants };
