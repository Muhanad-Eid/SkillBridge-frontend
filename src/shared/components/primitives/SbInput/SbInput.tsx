import { forwardRef, type InputHTMLAttributes } from "react";
import controlStyles from "../FormControl.module.scss";
import { getDescribedBy } from "../formControlA11y";

export type SbInputProps = InputHTMLAttributes<HTMLInputElement> & {
  isInvalid?: boolean;
  errorId?: string;
};

const SbInput = forwardRef<HTMLInputElement, SbInputProps>(function SbInput(
  {
    isInvalid = false,
    errorId,
    className = "",
    "aria-describedby": describedBy,
    ...props
  },
  ref,
) {
  return (
    <input
      {...props}
      ref={ref}
      className={[
        controlStyles.control,
        isInvalid ? controlStyles.invalid : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-invalid={isInvalid || undefined}
      aria-describedby={getDescribedBy(describedBy, errorId)}
    />
  );
});

export default SbInput;
