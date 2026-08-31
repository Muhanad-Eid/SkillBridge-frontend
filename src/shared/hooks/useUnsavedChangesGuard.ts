import { useEffect } from "react";
import { useBlocker } from "react-router-dom";

export type UnsavedChangesGuardOptions = {
  isDirty: boolean;
  enabled?: boolean;
  message?: string;
};

export default function useUnsavedChangesGuard({
  isDirty,
  enabled = true,
  message = "You have unsaved changes. Leave this page?",
}: UnsavedChangesGuardOptions) {
  useEffect(() => {
    if (!enabled || !isDirty) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [enabled, isDirty]);

  const blocker = useBlocker(() => enabled && isDirty);

  useEffect(() => {
    if (blocker.state !== "blocked") {
      return;
    }

    const shouldLeave = window.confirm(message);

    if (shouldLeave) {
      blocker.proceed();
      return;
    }

    blocker.reset();
  }, [blocker, message]);
}
