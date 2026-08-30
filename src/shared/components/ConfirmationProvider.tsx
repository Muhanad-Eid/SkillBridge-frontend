import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import ConfirmDialog from "./ConfirmDialog";
import {
  ConfirmationContext,
  type ConfirmationOptions,
} from "./ConfirmationContext";

export default function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmationOptions | null>(null);
  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null);

  const finish = useCallback((confirmed: boolean) => {
    resolverRef.current?.(confirmed);
    resolverRef.current = null;
    setOptions(null);
  }, []);

  const confirm = useCallback((nextOptions: ConfirmationOptions) => {
    resolverRef.current?.(false);
    setOptions(nextOptions);

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmationContext.Provider value={value}>
      {children}
      <ConfirmDialog
        isOpen={options !== null}
        title={options?.title ?? "Confirm action"}
        description={options?.description ?? ""}
        confirmLabel={options?.confirmLabel ?? "Confirm"}
        cancelLabel={options?.cancelLabel}
        variant={options?.variant}
        onCancel={() => finish(false)}
        onConfirm={() => finish(true)}
      />
    </ConfirmationContext.Provider>
  );
}
