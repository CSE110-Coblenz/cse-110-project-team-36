import React from "react";
import { Input } from "../input";
import { Button } from "../button";
import { ErrorMessage } from "../errorMsg";

export const UsernameStep: React.FC<{
  username: string;
  error: string | null;
  onChange: (v: string) => void;
  onContinue: () => void;
}> = ({ username, error, onChange, onContinue }) => (
  <div
    style={{ display: "grid", gap: 14, textAlign: "left", marginBottom: 12 }}
  >
    <Input
      label="Username"
      value={username}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && onContinue()}
      placeholder="SpeedBlaster99"
      autoFocus
    />
    <ErrorMessage message={error} />
    <Button additionalStyle={btnBlue} onClick={onContinue}>
      Continue
    </Button>
  </div>
);

const btnBlue: React.CSSProperties = {
  background: "var(--btn-blue-gradient)",
  boxShadow: "var(--shadow-blue), var(--shadow-cyan)",
  color: "var(--color-black)",
};
