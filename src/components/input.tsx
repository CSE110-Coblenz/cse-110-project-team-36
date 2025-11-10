interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelClassName?: string; // optional CSS class for label
  className?: string; // optional CSS class for input
}

export const Input: React.FC<InputProps> = ({
  label,
  labelClassName,
  className,
  ...props
}) => (
  <div style={{ display: "grid", gap: 4 }}>
    {label && <label className={labelClassName}>{label}</label>}
    <input className={className} {...props} />
  </div>
);
