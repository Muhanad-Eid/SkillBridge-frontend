import { forwardRef, type TextareaHTMLAttributes } from "react";
import controlStyles from "../FormControl.module.scss";
import { getDescribedBy } from "../formControlA11y";

export type SbTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  isInvalid?: boolean;
  errorId?: string;
};

const SbTextarea = forwardRef<HTMLTextAreaElement, SbTextareaProps>(
  function SbTextarea(
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
      <textarea
        {...props}
        ref={ref}
        className={[
          controlStyles.control,
          controlStyles.textarea,
          isInvalid ? controlStyles.invalid : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        aria-invalid={isInvalid || undefined}
        aria-describedby={getDescribedBy(describedBy, errorId)}
      />
    );
  },
);

export default SbTextarea;
