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
import { MiniGameOverlay } from '../rendering/game/MiniGameOverlay';


interface RacePageProps {
    raceController: RaceController;
    currentUser: string | null;
    onExit: () => void;
}

export const RacePage: React.FC<RacePageProps> = ({
    raceController,
    currentUser,
    onExit,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ w: PAGE_WIDTH, h: PAGE_HEIGHT });
    const [, setFrame] = useState(0);
    const [showMinigame, setShowMinigame] = useState(false);
    const paused = raceController.getGameState().paused;

    useEffect(() => {
        if (!containerRef.current) return;

        raceController.start(
            containerRef.current,
            (w, h) => setSize({ w, h }),
            () => setFrame((f) => f + 1),
        );

        return () => {
            raceController.stop();
        };
    }, [raceController]);

    const gs = raceController.getGameState();
    const questionController = raceController.getQuestionController();
    const streakController = raceController.getStreakController();
    const elapsedMs = raceController.getElapsedMs();
    const accuracy = raceController.getAccuracy();
    const correctCount = raceController.getCorrectCount();
    const incorrectCount = raceController.getIncorrectCount();

    const handleResume = () => raceController.resume();
    const handleSettings = () => events.emit('SettingsRequested', {});
    const handleExitToMenu = () => {
        raceController.exitRace(currentUser);
        onExit();
    };

    const handleOpenMinigame = () => {
        setShowMinigame(true);
        // optional: pause race when entering minigame if API supports it
        // if (!raceController.getGameState().paused) {
        //     raceController.togglePause();
        // }
    };

    const handleCloseMinigame = () => {
        setShowMinigame(false);
        // optional: resume race here if you paused it above
        // if (raceController.getGameState().paused) {
        //     raceController.resume();
        // }
    };

    return (
        <div ref={containerRef} className={styles.racePage}>
            <QuestionAnswer
                questionController={questionController}
                streakController={streakController}
            />
            <GameStage gs={gs} width={size.w} height={size.h} />

            <div className={styles.pausePlacement}>
                <Button
                    onClick={() => raceController.togglePause()}
                    aria-pressed={paused ? 'true' : 'false'}
                    title="Pause / Open Menu"
                    className={styles.pauseButton}
                >
                    Pause
                </Button>

                {/* neww Minigame button */}
                <Button
                    onClick={handleOpenMinigame}
                    title="Open Minigame"
                    className={styles.minigameButton}
                >
                    Minigame
                </Button>


            </div>

            <Hud
                lap={(gs.playerCar?.lapCount ?? 0) + 1}
                elapsedMs={elapsedMs}
                accuracy={accuracy}
                correctCount={correctCount}
                incorrectCount={incorrectCount}
            />

            <PauseOverlay
                visible={paused}
                onResume={handleResume}
                onSettings={handleSettings}
                onExit={handleExitToMenu}
            />

            <PostRaceStats
                statsManager={raceController.getStatsManager()}
                time={raceController.getElapsedMs() / 1000}
                onExit={handleExitToMenu}
            />
            <MiniGameOverlay
                visible={showMinigame}
                onClose={handleCloseMinigame}
                questionController={questionController}
            />
        </div>
    );
};
