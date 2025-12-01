import React, { useEffect, useRef, useState } from 'react';
import { GameStage } from '../rendering/game/GameStage';
import { QuestionAnswer } from '../rendering/game/QuestionAnswer';
import { PauseOverlay } from '../rendering/game/PauseOverlay';
import { Hud } from '../rendering/game/Hud';
import { RaceController } from '../game/controllers/RaceController';
import { PAGE_WIDTH, PAGE_HEIGHT } from '../const';
import { events } from '../shared/events';
import { PostRaceStats } from '../rendering/game/RaceFinishedPage';
import { Button } from '../components/button';
import styles from './styles/racePage.module.css';


interface RacePageProps {
    raceController: RaceController;
    currentUser: string | null;
    onExit: () => void;
}

/**
 * Build a view model from a RaceController
 * This is a bridge function during migration - eventually RaceController should provide this directly
 */

export const RacePage: React.FC<RacePageProps> = ({
    raceController,
    currentUser,
    onExit,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ w: PAGE_WIDTH, h: PAGE_HEIGHT });
    const [, setFrame] = useState(0);
    const [, forceUpdate] = useState(0)

    useEffect(() => {
        if (!containerRef.current) return;

        raceController.start(
            containerRef.current,
            (w, h) => setSize({ w, h }),
            () => {
                setFrame((f) => f + 1);
                forceUpdate((n) => n + 1); // Force update to refresh view models
            },
        );

        return () => {
            raceController.stop();
        };
    }, [raceController]);

    // Subscribe to question state changes to update view model
    useEffect(() => {
        const unsubscribe = events.on('QuestionStateChanged', () => {
            forceUpdate((n) => n + 1);
        });
        return unsubscribe;
    }, []);

    // Update streak bar periodically
    useEffect(() => {
        const id = setInterval(() => {
            forceUpdate((n) => n + 1);
        }, 100);
        return () => clearInterval(id);
    }, []);

    const viewModel = raceController.buildViewModel(currentUser, onExit);
    const gs = viewModel.gameState;

    const handleSettings = () => events.emit('SettingsRequested', {});

    return (
        <div ref={containerRef} className={styles.racePage}>
            <QuestionAnswer
                viewModel={viewModel.questionAnswerViewModel}
                streakBarViewModel={viewModel.streakBarViewModel}
            />
            <GameStage gs={gs} width={size.w} height={size.h} />

            <div className={styles.pausePlacement}>
                <Button
                    onClick={viewModel.onTogglePause}
                    aria-pressed={viewModel.paused ? 'true' : 'false'}
                    title="Pause / Open Menu"
                    className={styles.pauseButton}
                >
                    Pause
                </Button>
            </div>

            <Hud
                lap={(gs.playerCar?.lapCount ?? 0) + 1}
                elapsedMs={viewModel.elapsedMs}
                accuracy={viewModel.accuracy}
                correctCount={viewModel.correctCount}
                incorrectCount={viewModel.incorrectCount}
            />

            <PauseOverlay
                visible={viewModel.paused}
                onResume={viewModel.onResume}
                onSettings={handleSettings}
                onExit={viewModel.onExit}
            />

            <PostRaceStats viewModel={viewModel.postRaceStatsViewModel} />
        </div>
    );
};
