import React from "react";
import { Input } from "../input";
import { Button } from "../button";
import { ErrorMessage } from "../errorMsg";
// import styles from "../../pages/styles/loginPage.module.css";

export const SignupStep: React.FC<{
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  error: string | null;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onConfirmChange: (v: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}> = ({
  username,
  email,
  password,
  confirmPassword,
  error,
  onEmailChange,
  onPasswordChange,
  onConfirmChange,
  onSubmit,
  onBack,
}) => (
  <form
    onSubmit={(e) => {
      e.preventDefault();
      onSubmit();
    }}
    style={{ display: "grid", gap: 14, textAlign: "left", marginBottom: 12 }}
  >
    <Input label="Username" value={username} disabled />
    <Input
      label="Email"
      value={email}
      onChange={(e) => onEmailChange(e.target.value)}
    />
    <Input
      label="Password"
      type="password"
      value={password}
      onChange={(e) => onPasswordChange(e.target.value)}
    />
    <Input
      label="Confirm Password"
      type="password"
      value={confirmPassword}
      onChange={(e) => onConfirmChange(e.target.value)}
    />
    <ErrorMessage message={error} />
    <Button
      type="submit"
      onClick={() => {
        console.log("Account registered!");
      }}
    >
      Sign Up
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
