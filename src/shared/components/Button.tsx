import { type ButtonHTMLAttributes, type ReactNode } from "react";
import SbButton, {
  type SbButtonSize,
} from "./primitives/SbButton/SbButton";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  to?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: SbButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
};

export default function Button({
  children,
  to,
  variant = "primary",
  size = "md",
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
      size={size}
      fullWidth={fullWidth}
      isLoading={isLoading}
      className={classes}
      disabled={disabled}
    >
      {children}
    </SbButton>
  );
}
