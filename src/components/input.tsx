import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelStyle?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
}

export const Input: React.FC<InputProps> = ({
  label,
  labelStyle,
  inputStyle,
  ...props // all the other default props that come along input
}) => (
  <div style={{ display: "grid", gap: 4 }}>
    {label && <label style={labelStyle}>{label}</label>}
    <input style={inputStyle} {...props} />
  </div>
);
