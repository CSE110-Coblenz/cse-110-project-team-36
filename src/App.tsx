import './global.css';
import { RacePage } from './pages/RacePage';
import { MainMenuPage } from './pages/MainMenuPage';
import { LoginPage } from './pages/LoginPage';
import DifficultySelectionScreen from './pages/DifficultySelectionScreen';
import LevelSelectionPage from './pages/LevelSelectionPage';
import { LevelSelectionController } from './game/controllers/LevelSelectionController';
import { useAppState } from './hooks/useAppState';

export default function App() {
    const {
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
    } = useAppState();

    const controller = new LevelSelectionController();

    if (screen === 'menu') {
        return (
            <MainMenuPage
                currentUser={currentUser}
                onStart={() => setScreen('difficulty')}
                onSignUpClick={() => setScreen('login')}
                onLogout={handleLogout}
                onCampaignClick={() => setScreen('campaign')}
            />
        );
    }

    if (screen === 'difficulty') {
        return (
            <DifficultySelectionScreen
                onBack={() => setScreen('menu')}
                onStartRace={handleStartRace}
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
                    onCampaignClick={() => setScreen('campaign')}
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

    if (screen === 'campaign') {
        return (
            <LevelSelectionPage
                controller={controller}
                onBack={() => setScreen('menu')}
                onLevelSelect={(level) => {
                    handleStartRace(level.topic, level.difficulty, level.track);
                }}
                currentUser={currentUser}
            />
        );
    }
}
