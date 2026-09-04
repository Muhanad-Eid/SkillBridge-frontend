import type {
  ButtonHTMLAttributes,
  MouseEvent,
  ReactNode,
} from "react";
import { Link } from "react-router-dom";
import styles from "./SbButton.module.scss";

export type SbButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type SbButtonSize = "sm" | "md" | "lg" | "icon";

export type SbButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  to?: string;
  variant?: SbButtonVariant;
  size?: SbButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
};

export default function SbButton({
  children,
  to,
  variant = "primary",
  size = "md",
  fullWidth = false,
  isLoading = false,
  className = "",
  disabled = false,
  onClick,
  type = "button",
  ...buttonProps
}: SbButtonProps) {
  const isDisabled = disabled || isLoading;
  const tooltip =
    buttonProps.title ??
    (size === "icon" && typeof buttonProps["aria-label"] === "string"
      ? buttonProps["aria-label"]
      : undefined);
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {isLoading ? <span className={styles.spinner} aria-hidden="true" /> : null}
      {size === "icon" ? (
        <span className={styles.iconContent}>{children}</span>
      ) : (
        children
      )}
    </>
  );

  if (to) {
    function handleLinkClick(event: MouseEvent<HTMLAnchorElement>) {
      if (isDisabled) {
        event.preventDefault();
        return;
      }

      onClick?.(event as unknown as MouseEvent<HTMLButtonElement>);
    }

    return (
      <Link
        className={classes}
        to={to}
        aria-busy={isLoading || undefined}
        aria-disabled={isDisabled || undefined}
        tabIndex={isDisabled ? -1 : undefined}
        title={tooltip}
        onClick={handleLinkClick}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      {...buttonProps}
      className={classes}
      title={tooltip}
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      onClick={onClick}
    >
      {content}
    </button>
  );
}
