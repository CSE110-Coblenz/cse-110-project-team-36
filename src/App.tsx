import { useState, useEffect } from 'react';
import { RacePage } from './pages/RacePage';
import { MainMenuPage } from './pages/MainMenuPage';
import { LoginPage } from './pages/LoginPage';
import DifficultySelectionScreen from './pages/DifficultySelectionScreen';
import {
    getCurrentUser,
    saveCurrentUser,
    logout as logoutUser,
    getUser,
    updateUserPreferences,
} from './services/localStorage';
import { RaceService } from './services/RaceService';
import { RaceController } from './game/controllers/RaceController';
import {
    topicStringToEnum,
    difficultyStringToEnum,
} from './utils/questionUtils';
import './global.css';

type Screen = 'menu' | 'race' | 'login' | 'difficulty';

export default function App() {
    const initializeUserState = () => {
        const user = getCurrentUser();
        if (user) {
            const userProfile = getUser(user);
            return {
                user,
                topic: userProfile?.preferences?.lastTopic || '',
                difficulty: userProfile?.preferences?.lastDifficulty || '',
                track: userProfile?.preferences?.lastTrack || 'track1',
            };
        }
        return {
            user: null,
            topic: '',
            difficulty: '',
            track: 'track1',
        };
    };

    const initialUserState = initializeUserState();
    const [screen, setScreen] = useState<Screen>('menu');
    const [currentUser, setCurrentUser] = useState<string | null>(
        initialUserState.user,
    );
    const [selectedTopic, setSelectedTopic] = useState<string>(
        initialUserState.topic,
    );
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>(
        initialUserState.difficulty,
    );
    const [selectedTrack, setSelectedTrack] = useState<string>(
        initialUserState.track,
    );
    const [raceController, setRaceController] = useState<RaceController | null>(
        null,
    );
    const [isLoadingRace, setIsLoadingRace] = useState(false);

    const handleLogin = (username: string) => {
        saveCurrentUser(username);
        setCurrentUser(username);
        setScreen('menu');
    };

    const handleLogout = () => {
        logoutUser();
        setCurrentUser(null);
        setScreen('menu');
    };

    // Initialize race controller when entering race screen
    useEffect(() => {
        if (
            screen === 'race' &&
            selectedTopic &&
            selectedDifficulty &&
            selectedTrack
        ) {
            // Setting loading state before async operation is a valid pattern
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsLoadingRace(true);
            let controller: RaceController | null = null;

            RaceService.initializeRace(selectedTrack, {
                topic: topicStringToEnum(selectedTopic),
                difficulty: difficultyStringToEnum(selectedDifficulty),
            })
                .then((c) => {
                    controller = c;
                    setRaceController(c);
                    setIsLoadingRace(false);
                })
                .catch((err) => {
                    console.error('Failed to load track:', err);
                    setIsLoadingRace(false);
                    // Fall back to menu on error
                    setScreen('menu');
                });

            return () => {
                if (controller) {
                    controller.destroy();
                }
                setRaceController(null);
                setIsLoadingRace(false);
            };
        }
    }, [screen, selectedTopic, selectedDifficulty, selectedTrack]);

    if (screen === 'menu') {
        return (
            <MainMenuPage
                currentUser={currentUser}
                onStart={() => setScreen('difficulty')}
                onSignUpClick={() => setScreen('login')}
                onLogout={handleLogout}
            />
        );
    }

    if (screen === 'difficulty') {
        return (
            <DifficultySelectionScreen
                onBack={() => setScreen('menu')}
                onStartRace={(topic, difficulty, track) => {
                    setSelectedTopic(topic);
                    setSelectedDifficulty(difficulty);
                    setSelectedTrack(track);
                    setScreen('race');

                    if (currentUser) {
                        updateUserPreferences(currentUser, {
                            lastTopic: topic,
                            lastDifficulty: difficulty,
                            lastTrack: track,
                        });
                    }
                }}
            />
        );
    }

    if (screen === 'race') {
        if (!selectedTopic || !selectedDifficulty || !selectedTrack) {
            // TODO: handle error case gracefully
            return (
                <MainMenuPage
                    currentUser={currentUser}
                    onStart={() => setScreen('difficulty')}
                    onSignUpClick={() => setScreen('login')}
                    onLogout={handleLogout}
                />
            );
        }

        if (isLoadingRace || !raceController) {
            return (
                <div
                    style={{
                        position: 'relative',
                        width: '100%',
                        height: '100vh',
                        background: '#0b1020',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '1.5rem',
                        fontWeight: 700,
                    }}
                >
                    Loading track...
                </div>
            );
        }

        return (
            <RacePage
                raceController={raceController}
                currentUser={currentUser}
                onExit={() => setScreen('menu')}
            />
        );
    }

    if (screen === 'login') {
        return (
            <LoginPage
                onPlayGuest={() => setScreen('difficulty')}
                onLogin={handleLogin}
                onBack={() => setScreen('menu')}
            />
        );
    }
}
