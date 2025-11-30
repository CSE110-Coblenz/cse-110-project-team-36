import React from 'react';
import type { QuestionAnswerViewModel } from '../view-models/QuestionAnswerViewModel';
import type { StreakBarViewModel } from '../view-models/StreakBarViewModel';
import { StreakBar } from './StreakBar';
import styles from '../styles/questionAnswer.module.css';
import { Button } from '../../components/button';

interface QuestionAnswerProps {
    viewModel: QuestionAnswerViewModel;
    streakBarViewModel: StreakBarViewModel;
}

export function QuestionAnswer({
    viewModel,
    streakBarViewModel,
}: QuestionAnswerProps) {
    const { answer, feedback, currentQuestion, onSubmit, onSkip } = viewModel;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit();
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
                <StreakBar viewModel={streakBarViewModel} />
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
                        onClick={onSkip}
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
