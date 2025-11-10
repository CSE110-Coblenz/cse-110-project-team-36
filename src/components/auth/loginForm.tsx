import React from "react";
import { Input } from "../input";
import { Button } from "../button";
import { ErrorMessage } from "../errorMsg";

export const LoginStep: React.FC<{
  username: string;
  password: string;
  error: string | null;
  onPasswordChange: (v: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}> = ({ username, password, error, onPasswordChange, onSubmit, onBack }) => (
  <form
    onSubmit={(e) => {
      e.preventDefault();
      onSubmit();
    }}
    style={{ display: "grid", gap: 14, textAlign: "left", marginBottom: 12 }}
  >
    <Input label="Username" value={username} disabled />
    <Input
      label="Password"
      type="password"
      value={password}
      onChange={(e) => onPasswordChange(e.target.value)}
      placeholder="••••••"
      autoFocus
    />
    <ErrorMessage message={error} />
    <Button
      type="submit"
      onClick={() => {
        console.log("Submitted!");
      }}
    >
      Login
    </Button>
    <Button additionalStyle={btnGray} type="button" onClick={onBack}>
      ← Change Username
    </Button>
  </form>
);

const btnGray: React.CSSProperties = {
  background: "var(--btn-gray-gradient)",
  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.6)",
  color: "var(--color-white)",
};
