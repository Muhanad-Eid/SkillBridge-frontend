type BrandIconProps = {
  className?: string;
};

export default function BrandIcon({ className = "" }: BrandIconProps) {
  return (
    <img
      className={`brand-mark brand-icon ${className}`.trim()}
      src="/skillbridge-icon.png"
      alt=""
      aria-hidden="true"
    />
  );
}
