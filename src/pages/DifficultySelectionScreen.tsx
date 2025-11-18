import React, { useState } from 'react';
import { AVAILABLE_TRACKS } from '../utils/trackList';
import styles from './styles/difficultySelectionPage.module.css';

interface DifficultySelectionScreenProps {
    onBack: () => void;
    onStartRace: (topic: string, difficulty: string, track: string) => void;
}

const DifficultySelectionScreen: React.FC<DifficultySelectionScreenProps> = ({
    onBack,
    onStartRace,
}) => {
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(
        null,
    );
    const [selectedTrack, setSelectedTrack] = useState<string | null>(null);

    const topics = ['Addition', 'Subtraction', 'Multiplication', 'Division'];
    const difficulties = ['Easy', 'Medium', 'Hard'];

    const handleStart = () => {
        if (selectedTopic && selectedDifficulty && selectedTrack) {
            onStartRace(selectedTopic, selectedDifficulty, selectedTrack);
        }
    };

    return (
        <div className={styles.difficultyScreen}>
            <div className={styles.overlay} />

            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <button onClick={onBack} className={styles.backButton}>
                        ← Back
                    </button>
                    <h1 className={styles.title}>Race Setup</h1>
                    <div style={{ width: 80 }} />
                </div>

                {/* Topic Selection */}
                <div>
                    <div className={styles.sectionTitle}>
                        Choose Your Math Topic
                    </div>
                    <div className={styles.optionGrid}>
                        {topics.map((topic) => (
                            <button
                                key={topic}
                                onClick={() => setSelectedTopic(topic)}
                                className={`${styles.optionButton} ${
                                    selectedTopic === topic
                                        ? styles.topicButtonActive
                                        : styles.topicButton
                                }`}
                            >
                                {topic}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Difficulty Selection */}
                <div>
                    <div className={styles.sectionTitle}>Choose Difficulty</div>
                    <div className={styles.optionGrid}>
                        {difficulties.map((level) => (
                            <button
                                key={level}
                                onClick={() => setSelectedDifficulty(level)}
                                className={`${styles.optionButton} ${
                                    selectedDifficulty === level
                                        ? styles.difficultyButtonActive
                                        : styles.difficultyButton
                                }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Track Selection */}
                <div>
                    <div className={styles.sectionTitle}>Choose Your Track</div>
                    <div className={styles.optionGrid}>
                        {AVAILABLE_TRACKS.map((track) => (
                            <button
                                key={track.id}
                                onClick={() => setSelectedTrack(track.id)}
                                className={`${styles.optionButton} ${
                                    selectedTrack === track.id
                                        ? styles.trackButtonActive
                                        : styles.trackButton
                                }`}
                            >
                                {track.name}
                            </button>
                        ))}
                    </div>
                    <div className={styles.trackDescription}>
                        {AVAILABLE_TRACKS.find((t) => t.id === selectedTrack)
                            ?.description || ''}
                    </div>
                </div>

                {/* Start Button */}
                <button
                    onClick={handleStart}
                    disabled={
                        !selectedTopic || !selectedDifficulty || !selectedTrack
                    }
                    className={`${styles.startButton} ${
                        selectedTopic && selectedDifficulty && selectedTrack
                            ? styles.startButtonEnabled
                            : styles.startButtonDisabled
                    }`}
                >
                    Start Race
                </button>
            </div>
        </div>
    );
};

export default DifficultySelectionScreen;
