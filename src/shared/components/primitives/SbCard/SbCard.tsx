import type { HTMLAttributes, ReactNode } from "react";
import styles from "./SbCard.module.scss";

export type SbCardVariant = "default" | "subtle" | "interactive" | "evidence";
export type SbCardPadding = "none" | "sm" | "md" | "lg";

export type SbCardProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  as?: "article" | "section" | "div";
  variant?: SbCardVariant;
  padding?: SbCardPadding;
};

export default function SbCard({
  children,
  as: Component = "article",
  variant = "default",
  padding = "md",
  className = "",
  ...props
}: SbCardProps) {
  const classes = [styles.card, styles[variant], styles[`padding-${padding}`], className]
    .filter(Boolean)
    .join(" ");

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
}
