/**
 * LevelSelectionPage (VIEW)
 */

import React, { useState } from 'react';
import { LevelSelectionController } from '../game/controllers/LevelSelectionController';
import type { Level } from '../game/models/LevelModel';

import styles from './styles/levelSelectionPage.module.css';

export const LevelSelectionPage: React.FC<{
    onBack: () => void;
    onLevelSelect: (level: Level) => void;
    currentUser: string | null;
    controller: LevelSelectionController;
}> = ({ onBack, onLevelSelect, currentUser, controller }) => {
    const [index, setIndex] = useState(0);

    const currentLevel = controller.getCurrentLevel();

    const goNext = () => setIndex(controller.nextLevel());
    const goPrev = () => setIndex(controller.prevLevel());

    return (
        <div className={styles.pageRoot}>
            {/* Translucent overlay */}
            <div className={styles.overlay} />

            {/* Main Card */}
            <div className={styles.card}>
                {/* Back Button */}
                <button className={styles.backButton} onClick={onBack}>
                    ← Back
                </button>

                {/* Header */}
                <div className={styles.header}>
                    <h1 className={styles.title}>🏆 CAMPAIGN MODE</h1>

                    {currentUser && (
                        <p className={styles.userWelcome}>
                            Welcome, {currentUser}! 🏎️
                        </p>
                    )}

                    <p className={styles.levelInfo}>
                        Level {index + 1} of {controller.getTotalLevels()}
                    </p>
                </div>

                {/* Level Display */}
                <div className={styles.levelDisplay}>
                    {/* Left Arrow */}
                    <button className={styles.arrowButton} onClick={goPrev}>
                        ‹
                    </button>

                    {/* Level Card */}
                    <div className={styles.levelCard}>
                        <div className={styles.levelNumber}>{index + 1}</div>
                        <h2 className={styles.levelName}>
                            {currentLevel.name}
                        </h2>
                        <div
                            className={styles.difficultyBadge}
                            style={{
                                background: controller.getDifficultyColor(
                                    currentLevel.difficulty,
                                ),
                            }}
                        >
                            {controller.getDifficultyText(
                                currentLevel.difficulty,
                            )}
                        </div>
                        <p className={styles.levelDescription}>
                            {currentLevel.description}
                        </p>

                        {/* Stats Grid */}
                        <div className={styles.statsGrid}>
                            <div>
                                <div className={styles.statsItemEmoji}>🎯</div>
                                <div>
                                    {controller.getTopicName(
                                        currentLevel.topic,
                                    )}
                                </div>
                                <div className={styles.statsItemSymbol}>
                                    {controller.getTopicSymbol(
                                        currentLevel.topic,
                                    )}
                                </div>
                            </div>

                            <div>
                                <div className={styles.statsItemEmoji}>📊</div>
                                <div>Difficulty</div>
                                <div className={styles.statsItemSymbol}>
                                    {controller.getDifficultyText(
                                        currentLevel.difficulty,
                                    )}
                                </div>
                            </div>

                            <div>
                                <div className={styles.statsItemEmoji}>🏁</div>
                                <div>Track</div>
                                <div className={styles.statsItemSymbol}>
                                    {currentLevel.track.toUpperCase()}
                                </div>
                            </div>
                        </div>

                        {/* Start Level Button */}
                        <button
                            className={styles.startButton}
                            onClick={() => onLevelSelect(currentLevel)}
                        >
                            START LEVEL {index + 1}
                        </button>
                    </div>

                    {/* Right Arrow */}
                    <button className={styles.arrowButton} onClick={goNext}>
                        ›
                    </button>
                </div>

                {/* Level Progress Dots */}
                <div className={styles.progressDots}>
                    {Array.from({ length: controller.getTotalLevels() }).map(
                        (_, i) => (
                            <div
                                key={i}
                                className={`${styles.dot} ${
                                    i === index
                                        ? styles.dotActive
                                        : styles.dotInactive
                                }`}
                                onClick={() => setIndex(i)}
                            />
                        ),
                    )}
                </div>
            </div>
        </div>
    );
};

export default LevelSelectionPage;
