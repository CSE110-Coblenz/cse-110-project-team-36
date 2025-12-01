import React from 'react';
import { Input } from '../input';
import { Button } from '../button';
import { ErrorMessage } from '../errorMsg';
import styles from "../styles/authStyle.module.css";

export const LoginStep: React.FC<{
    username: string;
    password: string;
    error: string | null;
    onPasswordChange: (v: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    onBack: () => void;
}> = ({ username, password, error, onPasswordChange, onSubmit, onBack }) => (
    <form onSubmit={onSubmit} className={styles.formContainer}>
        <Input
            label="Username"
            value={username}
            disabled
            className={styles.input}
        />
        <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="••••••"
            className={styles.input}
            autoFocus
        />
        <ErrorMessage message={error} />
        <Button
            type="submit"
            onClick={onSubmit}
            additionalStyle={{ background: 'var(--btn-blue-gradient)' }}
        >
            Login
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
