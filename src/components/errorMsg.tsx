import React from "react";

export const ErrorMessage: React.FC<{ message?: string | null }> = ({
  message,
}) => (message ? <div style={errorBoxStyle}>{message}</div> : null);

const errorBoxStyle: React.CSSProperties = {
  color: "var(--color-error)",
  fontSize: "0.85rem",
  textAlign: "center",
  padding: "8px",
  background: "var(--color-error-bg)",
  borderRadius: 8,
  border: "1px solid var(--color-error-border)",
};
