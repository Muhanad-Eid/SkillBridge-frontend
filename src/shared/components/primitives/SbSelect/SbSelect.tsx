import { forwardRef, type SelectHTMLAttributes } from "react";
import controlStyles from "../FormControl.module.scss";
import { getDescribedBy } from "../formControlA11y";

export type SbSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  isInvalid?: boolean;
  errorId?: string;
};

const SbSelect = forwardRef<HTMLSelectElement, SbSelectProps>(function SbSelect(
  {
    isInvalid = false,
    errorId,
    className = "",
    "aria-describedby": describedBy,
    children,
    ...props
  },
  ref,
) {
  return (
    <select
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
    >
      {children}
    </select>
  );
});

export default SbSelect;
