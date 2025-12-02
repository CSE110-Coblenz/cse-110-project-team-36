import { useState, useEffect, useRef } from 'react';
import { RaceController } from '../game/controllers/RaceController';
import { RaceControllerFactory } from '../game/factories/RaceControllerFactory';
import { userService } from '../services/userServiceInstance';
import {
    topicStringToEnum,
    difficultyStringToEnum,
} from '../utils/questionUtils';

type Screen = 'menu' | 'race' | 'login' | 'difficulty' | 'campaign';

interface UseAppStateReturn {
    screen: Screen;
    currentUser: string | null;
    selectedTopic: string;
    selectedDifficulty: string;
    selectedTrack: string;
    raceController: RaceController | null;
    isLoadingRace: boolean;
    setScreen: (screen: Screen) => void;
    handleLogin: (username: string) => void;
    handleLogout: () => void;
    handleStartRace: (topic: string, difficulty: string, track: string) => void;
}

/**
 * Custom hook for managing application state
 * Handles screen navigation, user state, and race controller lifecycle
 */
export function useAppState(): UseAppStateReturn {
    const initializeUserState = () => {
        const user = userService.getCurrentUser();
        if (user) {
            const userProfile = userService.getUser(user);
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
    const isLoadingRef = useRef(false);

    const handleLogin = (username: string) => {
        userService.saveCurrentUser(username);
        setCurrentUser(username);
        setScreen('menu');
    };

    const handleLogout = () => {
        userService.logout();
        setCurrentUser(null);
        setScreen('menu');
    };

    const handleStartRace = (
        topic: string,
        difficulty: string,
        track: string,
    ) => {
        setSelectedTopic(topic);
        setSelectedDifficulty(difficulty);
        setSelectedTrack(track);
        setScreen('race');

        if (currentUser) {
            userService.updateUserPreferences(currentUser, {
                lastTopic: topic,
                lastDifficulty: difficulty,
                lastTrack: track,
            });
        }
    };

    // Initialize race controller when entering race screen
    useEffect(() => {
        if (
            screen === 'race' &&
            selectedTopic &&
            selectedDifficulty &&
            selectedTrack &&
            !isLoadingRef.current
        ) {
            isLoadingRef.current = true;
            // Use setTimeout to defer state update to next tick, avoiding synchronous setState
            const timeoutId = setTimeout(() => {
                setIsLoadingRace(true);
            }, 0);

            let controller: RaceController | null = null;

            RaceControllerFactory.createRaceControllerAsync('race1.json', {
                topic: topicStringToEnum(selectedTopic),
                difficulty: difficultyStringToEnum(selectedDifficulty),
            })
                .then((c) => {
                    controller = c;
                    setRaceController(c);
                    setIsLoadingRace(false);
                    isLoadingRef.current = false;
                })
                .catch((err) => {
                    console.error('Failed to load track:', err);
                    setIsLoadingRace(false);
                    isLoadingRef.current = false;
                    // Fall back to menu on error
                    setScreen('menu');
                });

            return () => {
                clearTimeout(timeoutId);
                if (controller) {
                    controller.destroy();
                }
                setRaceController(null);
                setIsLoadingRace(false);
                isLoadingRef.current = false;
            };
        }
    }, [screen, selectedTopic, selectedDifficulty, selectedTrack]);

    return {
        screen,
        currentUser,
        selectedTopic,
        selectedDifficulty,
        selectedTrack,
        raceController,
        isLoadingRace,
        setScreen,
        handleLogin,
        handleLogout,
        handleStartRace,
    };
}
