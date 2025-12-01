import React, { useState, useEffect } from 'react';
import { events } from '../../shared/events';
import type { PostRaceStatsViewModel } from '../view-models/PostRaceStatsViewModel';

interface PostRaceStatsProps {
    viewModel: PostRaceStatsViewModel;
}

export const PostRaceStats: React.FC<PostRaceStatsProps> = ({
    viewModel,
}) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const unsubscribe = events.on('RaceFinished', () => {
            setShow(true);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    if (!show) {
        return null;
    }

    const { correctCount, incorrectCount, skippedCount, time, onExit } =
        viewModel;

    const formatTime = (t: number) => {
        const minutes = Math.floor(t / 60);
        const seconds = Math.floor(t % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div
            style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: '#111',
                color: '#fff',
                padding: 32,
                borderRadius: 16,
                boxShadow: '0 0 20px rgba(0,0,0,0.8)',
                zIndex: 10000,
                textAlign: 'center',
                minWidth: 300,
            }}
        >
            <h2 style={{ marginBottom: 16 }}>Race Complete!</h2>
            <div style={{ marginBottom: 8 }}>
                Correct Answers: {correctCount}
            </div>
            <div style={{ marginBottom: 8 }}>
                Wrong Answers: {incorrectCount}
            </div>
            <div style={{ marginBottom: 8 }}>
                Skipped Questions: {skippedCount}
            </div>
            <div style={{ marginBottom: 16 }}>Time: {formatTime(time)}</div>
            <button
                onClick={onExit}
                style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'linear-gradient(90deg,#ffef00,#ff2a00)',
                    color: '#000',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                }}
            >
                Back to Home
            </button>
        </div>
    );
};
