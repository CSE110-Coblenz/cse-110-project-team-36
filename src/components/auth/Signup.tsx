import React from 'react';
import { Input } from '../input';
import { Button } from '../button';
import { ErrorMessage } from '../errorMsg';
import styles from "../../pages/styles/loginPage.module.css";

export const SignupStep: React.FC<{
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    error: string | null;
    onEmailChange: (v: string) => void;
    onPasswordChange: (v: string) => void;
    onConfirmChange: (v: string) => void;
    onSubmit: (e: React.FormEvent) => void;
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
    <form onSubmit={onSubmit} className={styles.formContainer}>
        <Input
            label="Username"
            value={username}
            disabled
            className={styles.input}
        />
        <Input
            label="Email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="you@example.com"
            className={styles.input}
            type="email"
        />
        <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="••••••"
            className={styles.input}
        />
        <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => onConfirmChange(e.target.value)}
            placeholder="••••••"
            className={styles.input}
        />
        <ErrorMessage message={error} />
        <Button
            type="submit"
            onClick={onSubmit}
            additionalStyle={{ background: 'var(--btn-blue-gradient)' }}
        >
            Sign Up
        </Button>
        <Button
            type="button"
            onClick={onBack}
            additionalStyle={{ background: 'var(--btn-gray-gradient)' }}
        >
            ← Change Username
        </Button>
    </form>
);
