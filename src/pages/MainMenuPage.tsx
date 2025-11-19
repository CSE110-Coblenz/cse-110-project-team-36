/**
 * MainMenuPage
 *
 * The landing screen
 * Players can choose to play as guest, create an account,
 * start campaign, or adjust options sound/fullscreen.
 */

import React, { useState } from 'react';
import styles from './styles/mainMenuPage.module.css';
import { Button } from '../components/button';

export const MainMenuPage: React.FC<{
    currentUser: string | null;
    onStart: () => void;
    onSignUpClick: () => void;
    onLogout: () => void;
}> = ({ currentUser, onStart, onSignUpClick, onLogout }) => {
    const [soundOn, setSoundOn] = useState(true);
    const [fullscreen, setFullscreen] = useState(false);

    const toggleSound = () => setSoundOn(!soundOn);

    const toggleFullscreen = () => {
        if (!fullscreen) {
            document.documentElement.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
        setFullscreen(!fullscreen);
    };

    return (
        <div className={styles.mainMenu}>
            <div className={styles.overlay} />

            <div className={styles.menuCard}>
                {currentUser && (
                    <Button className={styles.logoutButton} onClick={onLogout}>
                        Logout
                    </Button>
                )}

                <h1 className={styles.title}>FORMULA FUN 🏁</h1>

                {currentUser && (
                    <p className={styles.welcome}>Welcome, {currentUser}! 🏎️</p>
                )}

                <p className={styles.subtitle}>Play, Learn, Fun!</p>

                <Button
                    className={`${styles.button} ${styles.btnYellow}`}
                    onClick={onStart}
                >
                    ▶ Start Race
                </Button>

                <Button
                    className={`${styles.button} ${styles.btnBlue}`}
                    onClick={onSignUpClick}
                >
                    {currentUser ? 'Switch Account' : 'Create Account'}
                </Button>

                <Button
                    className={`${styles.button} ${styles.btnGreen}`}
                    onClick={toggleSound}
                >
                    {soundOn ? 'Sound: ON' : 'Sound: OFF'}
                </Button>

                <Button
                    className={`${styles.button} ${styles.btnGray}`}
                    onClick={toggleFullscreen}
                >
                    {fullscreen ? 'Exit Full Screen' : 'Full Screen'}
                </Button>

                <p className={styles.footer}></p>
            </div>
        </div>
    );
};
