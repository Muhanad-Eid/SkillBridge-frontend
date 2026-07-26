import { Moon, Sun } from "lucide-react";
import { useTheme } from "../theme/ThemeContext";

type ThemeToggleProps = {
  className?: string;
};

export default function ThemeToggle({
  className = "",
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      className={["theme-toggle", className].filter(Boolean).join(" ")}
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={isDark}
      onClick={toggleTheme}
    >
      {isDark ? (
        <Sun size={19} aria-hidden="true" />
      ) : (
        <Moon size={19} aria-hidden="true" />
      )}
    </button>
  );
}
