import React from "react";
import { Input } from "../input";
import { Button } from "../button";
import { ErrorMessage } from "../errorMsg";
import styles from "../../pages/styles/loginPage.module.css";

export const UsernameStep: React.FC<{
  username: string;
  error: string | null;
  onChange: (v: string) => void;
  onContinue: () => void;
}> = ({ username, error, onChange, onContinue }) => (
  <div className={styles.formContainer}>
    <Input
      label="Username"
      value={username}
      onChange={(e) => onChange(e.target.value)}
      placeholder="SpeedBlaster99"
      className={styles.input}
      onKeyDown={(e) => e.key === "Enter" && onContinue()}
    />
    <ErrorMessage message={error} />
    <Button
      onClick={onContinue}
      additionalStyle={{ background: "var(--btn-blue-gradient)" }}
    >
      Continue
    </Button>
  </div>
);
