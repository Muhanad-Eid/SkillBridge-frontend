import {
  forwardRef,
  useState,
  type InputHTMLAttributes,
} from "react";
import { Eye, EyeOff } from "lucide-react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, name, className = "", type, ...props }, ref) => {
    const inputId = id ?? name;
    const isPassword = type === "password";
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    return (
      <label className={`field ${className}`} htmlFor={inputId}>
        <span>{label}</span>
        <span className={`field-input ${isPassword ? "has-password-toggle" : ""}`}>
          <input
            ref={ref}
            id={inputId}
            name={name}
            type={isPassword && isPasswordVisible ? "text" : type}
            {...props}
          />
          {isPassword ? (
            <button
              type="button"
              className="password-toggle"
              aria-label={isPasswordVisible ? "Hide password" : "Show password"}
              title={isPasswordVisible ? "Hide password" : "Show password"}
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
        {error ? <small className="field-error">{error}</small> : null}
      </label>
    );
  },
);

Input.displayName = "Input";

export default Input;
