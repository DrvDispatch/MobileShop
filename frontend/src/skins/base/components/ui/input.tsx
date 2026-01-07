import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, error, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-12 w-full rounded-xl border-2 bg-white px-4 py-3 text-base transition-all duration-200",
                    "border-zinc-200 placeholder:text-zinc-400 text-zinc-900",
                    "focus:outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500",
                    "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-zinc-50",
                    error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Input.displayName = "Input";

export { Input };
