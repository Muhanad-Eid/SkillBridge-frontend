import { type ButtonHTMLAttributes, type ReactNode } from "react";
import SbButton from "./primitives/SbButton/SbButton";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  to?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  fullWidth?: boolean;
  isLoading?: boolean;
};

export default function Button({
  children,
  to,
  variant = "primary",
  fullWidth = false,
  isLoading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const classes = ["button", `button-${variant}`, fullWidth ? "button-full" : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <SbButton
      {...props}
      to={to}
      variant={variant}
      fullWidth={fullWidth}
      isLoading={isLoading}
      className={classes}
      disabled={disabled}
    >
      {children}
    </SbButton>
  );
}
