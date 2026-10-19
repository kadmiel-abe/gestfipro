import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-xs sm:text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#EF4444] disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
          variant === "default" && "bg-[#EF4444] text-white shadow hover:bg-[#DC2626]",
          variant === "destructive" && "bg-red-500 text-white shadow-sm hover:bg-red-600",
          variant === "outline" && "border border-[#27272A] bg-transparent hover:bg-[#27272A] text-[#FAFAFA]",
          variant === "secondary" && "bg-[#27272A] text-[#FAFAFA] shadow-sm hover:bg-[#3F3F46]",
          variant === "ghost" && "hover:bg-[#27272A] text-[#FAFAFA]",
          variant === "link" && "text-[#EF4444] underline-offset-4 hover:underline",
          size === "default" && "h-9 px-4 py-2",
          size === "sm" && "h-8 rounded-lg px-3 text-xs",
          size === "lg" && "h-10 rounded-xl px-8",
          size === "icon" && "h-9 w-9",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
