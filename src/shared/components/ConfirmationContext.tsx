import { createContext, useContext } from "react";
import type { ConfirmDialogVariant } from "./ConfirmDialog";

export type ConfirmationOptions = {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
};

export type ConfirmationContextValue = {
  confirm: (options: ConfirmationOptions) => Promise<boolean>;
};

export const ConfirmationContext =
  createContext<ConfirmationContextValue | null>(null);

export function useConfirmation() {
  const context = useContext(ConfirmationContext);

  if (!context) {
    throw new Error("useConfirmation must be used inside ConfirmationProvider.");
  }

  return context.confirm;
}
