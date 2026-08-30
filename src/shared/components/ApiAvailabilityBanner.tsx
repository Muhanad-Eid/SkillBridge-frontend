import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, ServerOff } from "lucide-react";
import { API_HEALTH_URL } from "../api/httpClient";
import styles from "./ApiAvailabilityBanner.module.scss";

const HEALTH_CHECK_INTERVAL_MS = 30_000;
const HEALTH_CHECK_TIMEOUT_MS = 5_000;

type ApiState = "checking" | "available" | "unavailable";

export default function ApiAvailabilityBanner() {
  const [apiState, setApiState] = useState<ApiState>("checking");
  const [isRetrying, setIsRetrying] = useState(false);
  const mountedRef = useRef(true);

  const checkHealth = useCallback(async (showProgress = false) => {
    if (showProgress) setIsRetrying(true);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);

    try {
      const response = await fetch(API_HEALTH_URL, {
        cache: "no-store",
        signal: controller.signal,
      });

      if (mountedRef.current) {
        setApiState(response.ok ? "available" : "unavailable");
      }
    } catch {
      if (mountedRef.current) setApiState("unavailable");
    } finally {
      window.clearTimeout(timeout);
      if (mountedRef.current) setIsRetrying(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const initialCheck = window.setTimeout(() => void checkHealth(), 0);

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void checkHealth();
    }, HEALTH_CHECK_INTERVAL_MS);

    const handleOnline = () => void checkHealth();
    window.addEventListener("online", handleOnline);

    return () => {
      mountedRef.current = false;
      window.clearTimeout(initialCheck);
      window.clearInterval(interval);
      window.removeEventListener("online", handleOnline);
    };
  }, [checkHealth]);

  if (apiState !== "unavailable") return null;

  return (
    <aside className={styles.banner} role="status" aria-live="polite">
      <ServerOff size={18} aria-hidden="true" />
      <div>
        <strong>SkillBridge is temporarily offline</strong>
        <span>The API or database cannot be reached. Your current page is still safe.</span>
      </div>
      <button type="button" disabled={isRetrying} onClick={() => void checkHealth(true)}>
        <RefreshCw className={isRetrying ? styles.spinning : ""} size={16} aria-hidden="true" />
        {isRetrying ? "Checking" : "Retry"}
      </button>
    </aside>
  );
}
