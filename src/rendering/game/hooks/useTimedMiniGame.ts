import { useCallback, useEffect, useRef, useState } from 'react';
import { events } from '../../../shared/events';

type MiniGameStage = 'playing' | 'finished';

const MINI_GAME_CONFIG = {
  totalQuestions: 10,
  totalTimeSeconds: 20,
};

interface MiniGameState {
  correct: number;
  missed: number;
  answered: number;
  timeLeft: number;
  stage: MiniGameStage;
}

export function useTimedMiniGame(visible: boolean) {
  const [state, setState] = useState<MiniGameState>({
    correct: 0,
    missed: 0,
    answered: 0,
    timeLeft: MINI_GAME_CONFIG.totalTimeSeconds,
    stage: 'playing',
  });

  const timerRef = useRef<number | null>(null);
  const stageRef = useRef<MiniGameStage>('playing');

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = window.setInterval(() => {
      setState((prev) => {
        if (stageRef.current === 'finished') return prev;

        const nextTime = Math.max(0, prev.timeLeft - 0.1);
        if (nextTime <= 0.01) {
          stageRef.current = 'finished';
          stopTimer();
          return { ...prev, timeLeft: 0, stage: 'finished' };
        }
        return { ...prev, timeLeft: parseFloat(nextTime.toFixed(1)) };
      });
    }, 100);
  }, [stopTimer]);

  // Used by the "Play Again" button
  const resetRun = useCallback(() => {
    stageRef.current = 'playing';
    setState({
      correct: 0,
      missed: 0,
      answered: 0,
      timeLeft: MINI_GAME_CONFIG.totalTimeSeconds,
      stage: 'playing',
    });
    startTimer();
  }, [startTimer]);

  useEffect(() => {
    if (!visible) {
      stopTimer();
      return;
    }

    // when overlay opens, start the timer
    startTimer();

    const handleOutcome = (wasCorrect: boolean) => {
      if (stageRef.current === 'finished') return;

      setState((prev) => {
        const answered = prev.answered + 1;
        const shouldFinish = answered >= MINI_GAME_CONFIG.totalQuestions;

        if (shouldFinish) {
          stageRef.current = 'finished';
          stopTimer();
        }

        return {
          correct: prev.correct + (wasCorrect ? 1 : 0),
          missed: prev.missed + (wasCorrect ? 0 : 1),
          answered,
          timeLeft: prev.timeLeft,
          stage: shouldFinish ? 'finished' : prev.stage,
        };
      });
    };

    const unsubCorrect = events.on('AnsweredCorrectly', () =>
      handleOutcome(true),
    );
    const unsubIncorrect = events.on('AnsweredIncorrectly', () =>
      handleOutcome(false),
    );
    const unsubSkipped = events.on('QuestionSkipped', () =>
      handleOutcome(false),
    );

    return () => {
      unsubCorrect();
      unsubIncorrect();
      unsubSkipped();
      stopTimer();
    };
  }, [visible, startTimer, stopTimer]);

  const accuracy =
    state.correct + state.missed === 0
      ? 0
      : Math.round(
        (state.correct / (state.correct + state.missed)) * 100,
      );

  const progressPercent = Math.min(
    100,
    (state.answered / MINI_GAME_CONFIG.totalQuestions) * 100,
  );

  return {
    state,
    resetRun,
    accuracy,
    progressPercent,
    config: MINI_GAME_CONFIG,
  };
}
