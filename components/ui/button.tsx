import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { twMerge } from "tailwind-merge"
import { clsx } from "clsx"

// Simple button because user didn't ask for full shadcn but requested "Professional"
// I am emulating shadcn button here.

const buttonVariants = (variant: string, size: string) => {
    const base = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

    const variants: any = {
        default: "bg-gray-900 text-white hover:bg-gray-900/90",
        destructive: "bg-red-500 text-white hover:bg-red-500/90",
        outline: "border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-100/80",
        ghost: "hover:bg-gray-100 hover:text-gray-900",
        link: "text-blue-600 underline-offset-4 hover:underline",
        blue: "bg-blue-600 text-white hover:bg-blue-700"
    }

    const sizes: any = {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
    }

    return twMerge(clsx(base, variants[variant] || variants.default, sizes[size] || sizes.default))
}


export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    asChild?: boolean
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "blue"
    size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={twMerge(buttonVariants(variant, size), className)}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
