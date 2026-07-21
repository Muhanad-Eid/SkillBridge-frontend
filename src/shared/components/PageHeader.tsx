import { type ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  actions?: ReactNode;
};

export default function PageHeader({
  title,
  actions,
}: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}
