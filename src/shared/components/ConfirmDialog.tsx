import { Check, LogOut, Trash2, TriangleAlert, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

export type ConfirmDialogVariant = "danger" | "warning" | "neutral" | "logout";

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  variant = "danger",
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocusedElement = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const focusTimeout = window.setTimeout(
      () => cancelButtonRef.current?.focus(),
      0,
    );

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);

      if (!firstElement || !lastElement) return;

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimeout);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedElement?.focus();
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const Icon =
    variant === "logout"
      ? LogOut
      : variant === "danger"
        ? Trash2
        : variant === "warning"
          ? TriangleAlert
          : Check;

  return (
    <div
      className="confirm-dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        ref={dialogRef}
        className={`confirm-dialog confirm-dialog-${variant}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <button
          type="button"
          className="confirm-dialog-close"
          aria-label="Close"
          title="Close"
          onClick={onCancel}
        >
          <X size={19} aria-hidden="true" />
        </button>

        <span className="confirm-dialog-icon" aria-hidden="true">
          <Icon size={22} />
        </span>
        <h2 id={titleId}>{title}</h2>
        <p id={descriptionId}>{description}</p>

        <footer>
          <button
            ref={cancelButtonRef}
            type="button"
            className="button button-secondary"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`button ${variant === "danger" || variant === "logout" ? "button-danger" : "button-primary"}`}
            onClick={onConfirm}
          >
            <Icon size={17} aria-hidden="true" />
            {confirmLabel}
          </button>
        </footer>
      </section>
    </div>
  );
}
