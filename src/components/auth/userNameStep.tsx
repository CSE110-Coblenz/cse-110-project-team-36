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
  onPlayGuest: () => void;
  onBack: () => void;
}> = ({ username, error, onChange, onContinue, onPlayGuest, onBack }) => (
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
    <Button
      onClick={onPlayGuest}
      additionalStyle={{ background: "var(--btn-yellow-gradient)" }}
    >
      Play as guest
    </Button>
    <Button
      onClick={onBack}
      additionalStyle={{ background: "var(--btn-gray-gradient)" }}
    >
      Back
    </Button>
    <p className={styles.helperText}>Enter your username to get started</p>
  </div>
);
