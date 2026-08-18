import { type ReactNode } from "react";
import SbCard from "./primitives/SbCard/SbCard";

type CardProps = {
  title?: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export default function Card({
  title,
  description,
  eyebrow,
  actions,
  children,
  className = "",
}: CardProps) {
  return (
    <SbCard className={`card ${className}`} padding="none">
      {(eyebrow || title || description || actions) && (
        <header className="card-header">
          <div>
            {eyebrow ? <p className="card-eyebrow">{eyebrow}</p> : null}
            {title ? <h3>{title}</h3> : null}
            {description ? <p>{description}</p> : null}
          </div>
          {actions ? <div className="card-actions">{actions}</div> : null}
        </header>
      )}
      {children ? <div className="card-body">{children}</div> : null}
    </SbCard>
  );
}
