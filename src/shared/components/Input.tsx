import {
  forwardRef,
  useEffect,
  useState,
  type InputHTMLAttributes,
} from "react";
import { Eye, EyeOff } from "lucide-react";
import SbInput from "./primitives/SbInput/SbInput";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, id, name, className = "", type, disabled, ...props },
    ref,
  ) => {
    const inputId = id ?? name;
    const isPassword = type === "password";
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    useEffect(() => {
      if (disabled) setIsPasswordVisible(false);
    }, [disabled]);

    return (
      <label className={`field ${className}`} htmlFor={inputId}>
        <span>{label}</span>
        <span className={`field-input ${isPassword ? "has-password-toggle" : ""}`}>
          <SbInput
            ref={ref}
            id={inputId}
            name={name}
            type={isPassword && isPasswordVisible ? "text" : type}
            disabled={disabled}
            isInvalid={Boolean(error)}
            errorId={error && inputId ? `${inputId}-error` : undefined}
            {...props}
          />
          {isPassword ? (
            <button
              type="button"
              className="password-toggle"
              aria-label={isPasswordVisible ? "Hide password" : "Show password"}
              title={isPasswordVisible ? "Hide password" : "Show password"}
              disabled={disabled}
              onClick={() => setIsPasswordVisible((visible) => !visible)}
            >
              {isPasswordVisible ? (
                <EyeOff size={18} aria-hidden="true" />
              ) : (
                <Eye size={18} aria-hidden="true" />
              )}
            </button>
          ) : null}
        </span>
        {error ? (
          <small className="field-error" id={inputId ? `${inputId}-error` : undefined}>
            {error}
          </small>
        ) : null}
      </label>
    );
  },
);

Input.displayName = "Input";

export default Input;
