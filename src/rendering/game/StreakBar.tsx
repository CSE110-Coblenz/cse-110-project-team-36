import React from 'react';
import type { StreakBarViewModel } from '../view-models/StreakBarViewModel';
import styles from '../styles/streakBar.module.css';

interface StreakBarProps {
    viewModel: StreakBarViewModel;
}

export const StreakBar: React.FC<StreakBarProps> = ({ viewModel }) => {
    const { gauge, state } = viewModel;

    // Toggle bar style on Streak active/ inactive
    const barClass =
        state === 'active'
            ? `${styles.barFill} ${styles.barActive}`
            : `${styles.barFill} ${styles.barInactive}`;

    // visible bar style
    return (
        <div className={styles.barContainer}>
            {/* Full bar when Streak activated */}
            <div
                className={barClass}
                style={{ width: `${Math.min(gauge, 100)}%` }}
            />
            <div className={styles.barText}>🔥 {state.toUpperCase()}</div>
        </div>
    );
};
