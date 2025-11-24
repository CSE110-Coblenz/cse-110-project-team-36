import React, { useState, useEffect } from 'react';
import { QuestionController } from '../../game/controllers/QuestionController';
import { StreakController } from '../../game/controllers/StreakController';
import { StreakBar } from './StreakBar';
import { events } from '../../shared/events';
import styles from '../styles/questionAnswer.module.css';
import { Button } from '../../components/button';

interface QuestionAnswerProps {
    questionController: QuestionController;
    streakController: StreakController;
}

export function QuestionAnswer({
    questionController,
    streakController,
}: QuestionAnswerProps) {
    // Force re-render to sync with controller state
    const [, forceUpdate] = useState(0);

    useEffect(() => {
        // Subscribe to state change events from controller
        const unsubscribe = events.on('QuestionStateChanged', () => {
            forceUpdate((n) => n + 1);
        });

        return unsubscribe;
    }, [questionController]);

    // Get state from controller
    const answer = questionController.getAnswer();
    const feedback = questionController.getFeedback();
    const currentQuestion = questionController.getCurrentQuestion();

    // Handlers are now simple - they just call controller methods
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        questionController.submitAnswer();
    };

    const handleSkip = () => {
        questionController.skipQuestion();
    };

    const feedbackClass =
        feedback === 'incorrect'
            ? styles.qaShake
            : feedback === 'correct'
              ? styles.qaPulse
              : '';

    const haloClass =
        feedback === 'correct'
            ? styles.haloGreen
            : feedback === 'incorrect'
              ? styles.haloRed
              : '';

    return (
        <div>
            <div className={styles.streakBarPlacement}>
                <StreakBar streakController={streakController} />
            </div>
            <form
                aria-label="Math question input"
                className={`${styles.card} ${feedbackClass} ${haloClass}`}
                onSubmit={handleSubmit}
            >
                {/* Title */}
                <div className={styles.title}>SOLVE 🏁</div>

                {/* Question */}
                <div
                    className={`${styles.question} ${
                        feedback === 'none'
                            ? styles.questionNeutral
                            : styles.questionActive
                    }`}
                >
                    {feedback === 'correct' && '✅ '}
                    {feedback === 'incorrect' && '❌ '}
                    <span>Question: </span>
                    <b>{currentQuestion}</b>
                </div>

                {/* Row */}
                <div className={styles.row}>
                    {/* Display-only answer */}
                    <div
                        aria-label="Your answer"
                        className={`${styles.answerInput} ${
                            answer ? '' : styles.answerPlaceholder
                        }`}
                    >
                        <span style={{ whiteSpace: 'pre-wrap' }}>
                            {answer}
                            <span aria-hidden className={styles.cursor} />
                        </span>
                    </div>

                    {/* Submit */}
                    <Button
                        type="submit"
                        className={styles.btnGreen}
                        onClick={() => {}}
                    >
                        Submit
                    </Button>

                    {/* Skip */}
                    <Button
                        type="button"
                        className={styles.btnGray}
                        onClick={handleSkip}
                        title="Skip (S)"
                    >
                        Skip
                    </Button>
                </div>

                {/* Hint */}
                <div className={styles.hint}>
                    Type numbers with your keyboard • Press <b>Enter</b> to
                    submit • Press <b>S</b> to skip
                </div>
            </form>
        </div>
    );
}
