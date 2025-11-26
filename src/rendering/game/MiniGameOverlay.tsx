import React from 'react';
import { Button } from '../../components/button';
import styles from '../styles/miniGameOverlay.module.css';
import { QuestionController } from '../../game/controllers/QuestionController';
import { useTimedMiniGame } from './hooks/useTimedMiniGame';

interface MiniGameOverlayProps {
    visible: boolean;
    onClose: () => void;
    questionController: QuestionController;
}

export const MiniGameOverlay: React.FC<MiniGameOverlayProps> = ({
    visible,
    onClose,
    questionController,
}) => {
    const { state, resetRun, accuracy, progressPercent, config } =
        useTimedMiniGame(visible);

    if (!visible) return null;

    const answer = questionController.getAnswer();
    const feedback = questionController.getFeedback();
    const currentQuestion = questionController.getCurrentQuestion();
    const { correct, missed, answered, timeLeft, stage } = state;

    const handleSubmit: React.FormEventHandler = (e) => {
        e.preventDefault();
        if (stage === 'finished') return;
        questionController.submitAnswer();
    };

    const handleSkip = () => {
        if (stage === 'finished') return;
        questionController.skipQuestion();
    };

    const feedbackClass =
        feedback === 'correct'
            ? styles.questionCorrect
            : feedback === 'incorrect'
                ? styles.questionIncorrect
                : '';

    const timePercent = Math.max(
        0,
        (timeLeft / config.totalTimeSeconds) * 100,
    );

    return (
        <div className={styles.overlay}>
            <form
                className={`${styles.card} ${styles.form}`}
                onSubmit={handleSubmit}
            >
                {/* Header stats */}
                <div className={styles.headerRow}>
                    <div className={styles.progressPill}>
                        <span className={styles.pillLabel}>Time Left</span>
                        <span className={styles.pillValue}>
                            {timeLeft.toFixed(1)}s
                        </span>
                    </div>
                    <div className={styles.progressPill}>
                        <span className={styles.pillLabel}>Questions</span>
                        <span className={styles.pillValue}>
                            {answered}/{config.totalQuestions}
                        </span>
                    </div>
                    <div className={styles.progressPill}>
                        <span className={styles.pillLabel}>Accuracy</span>
                        <span className={styles.pillValue}>{accuracy}%</span>
                    </div>
                </div>

                {/* Title */}
                <div className={styles.title}>Turbo Pit-Stop Quiz</div>
                <div className={styles.subtitle}>
                    Answer {config.totalQuestions} questions in{' '}
                    {config.totalTimeSeconds}s
                </div>

                {/* Time bar */}
                <div className={styles.timerTrack}>
                    <div
                        className={styles.timerFill}
                        style={{ width: `${timePercent}%` }}
                    />
                </div>

                {/* Question */}
                <div className={`${styles.question} ${feedbackClass}`}>
                    <span className={styles.questionLabel}>Solve:</span>
                    <span className={styles.questionText}>{currentQuestion}</span>
                </div>

                {/* Answer */}
                <div
                    className={styles.answerInput}
                    aria-label="Current answer"
                >
                    {answer}
                    <span className={styles.cursor} aria-hidden>
                        |
                    </span>
                </div>

                {stage === 'finished' ? (
                    <div className={styles.summary}>
                        <div className={styles.statRow}>
                            <span>Correct</span>
                            <strong>{correct}</strong>
                        </div>
                        <div className={styles.statRow}>
                            <span>Missed / Skipped</span>
                            <strong>{missed}</strong>
                        </div>
                        <div className={styles.statRow}>
                            <span>Accuracy</span>
                            <strong>{accuracy}%</strong>
                        </div>
                        <div className={styles.actions}>
                            <Button
                                type="button"
                                className={styles.btnPrimary}
                                onClick={resetRun}
                            >
                                Play Again
                            </Button>
                            <Button
                                type="button"
                                className={styles.btnGhost}
                                onClick={onClose}
                            >
                                Back to Race
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className={styles.actions}>
                            <Button type="submit" className={styles.btnPrimary} onClick={function (e: React.FormEvent): void {
                            }}>
                                Submit
                            </Button>
                            <Button
                                type="button"
                                className={styles.btnGhost}
                                onClick={handleSkip}
                            >
                                Skip
                            </Button>
                            <Button
                                type="button"
                                className={styles.btnGhost}
                                onClick={onClose}
                            >
                                Back to Race
                            </Button>
                        </div>

                        <div className={styles.questionProgressTrack}>
                            <div
                                className={styles.questionProgressFill}
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </>
                )}
            </form>
        </div>
    );
};
