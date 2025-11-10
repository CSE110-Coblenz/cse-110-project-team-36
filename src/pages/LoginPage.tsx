import React, { useState } from "react";
import {
  userExists,
  getUser,
  saveUser,
  hashPassword,
  verifyPassword,
} from "../services/localStorage";
import type { UserProfile } from "../services/localStorage";
import styles from "./styles/loginPage.module.css";
import { UsernameStep } from "../components/auth/userNameStep";
import { LoginStep } from "../components/auth/loginForm";
import { SignupStep } from "../components/auth/signup";

export const LoginPage: React.FC<{
  onPlayGuest: () => void;
  onLogin: (username: string) => void;
  onBack: () => void;
}> = ({ onPlayGuest, onLogin, onBack }) => {
  const [step, setStep] = useState<"username" | "login" | "signup">("username");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleContinue = () => {
    if (!username.trim()) {
      setError("Username is required");
      return;
    }
    setError(null);
    setStep(userExists(username) ? "login" : "signup");
  };

  const handleChangeUsername = () => {
    setStep("username");
    setPassword("");
    setConfirmPassword("");
    setEmail("");
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (step === "login") {
      const user = getUser(username);
      if (!user) return setError("User not found");
      if (!verifyPassword(password, user.passwordHash))
        return setError("Incorrect password");
      onLogin(username);
    } else if (step === "signup") {
      if (!email.trim() || !email.includes("@"))
        return setError("Valid email is required");
      if (password.length < 3)
        return setError("Password must be at least 3 characters");
      if (password !== confirmPassword)
        return setError("Passwords do not match");

      const newUser: UserProfile = {
        username: username.trim(),
        email: email.trim(),
        passwordHash: hashPassword(password),
        stats: [],
        preferences: {},
        createdAt: Date.now(),
      };

      saveUser(newUser);
      onLogin(username.trim());
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.overlay} />

      <div className={styles.card}>
        <h1 className={styles.title}>FORMULA FUN 🏁</h1>
        <p className={styles.subtitle}>
          {step === "username" && "Welcome!"}
          {step === "login" && "Welcome Back!"}
          {step === "signup" && "Join the Math Racers!"}
        </p>

        {step === "username" && (
          <UsernameStep
            username={username}
            error={error}
            onChange={setUsername}
            onContinue={handleContinue}
          />
        )}

        {step === "login" && (
          <LoginStep
            username={username}
            password={password}
            error={error}
            onPasswordChange={setPassword}
            onSubmit={handleSubmit}
            onBack={handleChangeUsername}
          />
        )}

        {step === "signup" && (
          <SignupStep
            username={username}
            email={email}
            password={password}
            confirmPassword={confirmPassword}
            error={error}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onConfirmChange={setConfirmPassword}
            onSubmit={handleSubmit}
            onBack={handleChangeUsername}
          />
        )}

        {step === "username" && (
          <>
            <button
              onClick={onPlayGuest}
              className={`${styles.btnBase} ${styles.btnYellow}`}
            >
              Play as Guest
            </button>
            <button
              onClick={onBack}
              className={`${styles.btnBase} ${styles.btnGray}`}
            >
              Back
            </button>
          </>
        )}
      </div>
    </div>
  );
};
