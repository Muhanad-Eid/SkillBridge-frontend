import { useEffect, useRef } from "react";

type PollingCallback = () => void | Promise<void>;

type VisibilityPollingOptions = {
  enabled?: boolean;
  runImmediately?: boolean;
};

export default function useVisibilityPolling(
  callback: PollingCallback,
  intervalMs: number,
  {
    enabled = true,
    runImmediately = false,
  }: VisibilityPollingOptions = {},
) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    let timeoutId: number | undefined;
    let isDisposed = false;
    let isRunning = false;

    function isAvailable() {
      return document.visibilityState === "visible" && navigator.onLine;
    }

    function clearScheduledRun() {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
        timeoutId = undefined;
      }
    }

    async function run() {
      if (isDisposed || isRunning || !isAvailable()) return;

      isRunning = true;
      try {
        await callbackRef.current();
      } catch {
        // Background refresh failures are surfaced by each screen's own state.
      } finally {
        isRunning = false;
      }
    }

    function schedule() {
      clearScheduledRun();
      if (isDisposed || !isAvailable()) return;

      timeoutId = window.setTimeout(async () => {
        await run();
        schedule();
      }, intervalMs);
    }

    function resume() {
      if (!isAvailable()) {
        clearScheduledRun();
        return;
      }

      void run();
      schedule();
    }

    if (runImmediately) {
      void run();
    }
    schedule();

    document.addEventListener("visibilitychange", resume);
    window.addEventListener("online", resume);
    window.addEventListener("offline", clearScheduledRun);

    return () => {
      isDisposed = true;
      clearScheduledRun();
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("online", resume);
      window.removeEventListener("offline", clearScheduledRun);
    };
  }, [enabled, intervalMs, runImmediately]);
}
