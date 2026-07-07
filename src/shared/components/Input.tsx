import {
  forwardRef,
  type InputHTMLAttributes,
} from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, name, className = "", ...props }, ref) => {
    const inputId = id ?? name;

    return (
      <label className={`field ${className}`} htmlFor={inputId}>
        <span>{label}</span>
        <input ref={ref} id={inputId} name={name} {...props} />
        {error ? <small className="field-error">{error}</small> : null}
      </label>
    );
  },
);

Input.displayName = "Input";

export default Input;
