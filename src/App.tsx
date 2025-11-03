import { useState } from 'react'
import { RacePage } from './pages/RacePage'
import { MainMenuPage } from './pages/MainMenuPage'
import { LoginPage } from './pages/LoginPage'
import DifficultySelectionScreen from './pages/DifficultySelectionScreen'
import { getCurrentUser, saveCurrentUser, logout as logoutUser, getUser, updateUserPreferences } from './services/localStorage'

type Screen = 'menu' | 'race' | 'login' | 'difficulty'

export default function App() {
    const initializeUserState = () => {
        const user = getCurrentUser()
        if (user) {
            const userProfile = getUser(user)
            return {
                user,
                topic: userProfile?.preferences?.lastTopic || '',
                difficulty: userProfile?.preferences?.lastDifficulty || '',
                track: userProfile?.preferences?.lastTrack || 'track1'
            }
        }
        return {
            user: null,
            topic: '',
            difficulty: '',
            track: 'track1'
        }
    }

    const initialUserState = initializeUserState()
    const [screen, setScreen] = useState<Screen>('menu')
    const [currentUser, setCurrentUser] = useState<string | null>(initialUserState.user)
    const [selectedTopic, setSelectedTopic] = useState<string>(initialUserState.topic)
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>(initialUserState.difficulty)
    const [selectedTrack, setSelectedTrack] = useState<string>(initialUserState.track)

    const handleLogin = (username: string) => {
        saveCurrentUser(username)
        setCurrentUser(username)
        setScreen('menu')
    }

    const handleLogout = () => {
        logoutUser()
        setCurrentUser(null)
        setScreen('menu')
    }

    if (screen === 'menu') {
        return (
            <MainMenuPage
                currentUser={currentUser}
                onStart={() => setScreen('difficulty')}
                onSignUpClick={() => setScreen('login')}
                onLogout={handleLogout}
            />
        )
    }

    if (screen === 'difficulty') {
        return (
            <DifficultySelectionScreen
                onBack={() => setScreen('menu')}
                onStartRace={(topic, difficulty, track) => {
                    setSelectedTopic(topic)
                    setSelectedDifficulty(difficulty)
                    setSelectedTrack(track)
                    setScreen('race')
                    
                    if (currentUser) {
                        updateUserPreferences(currentUser, {
                            lastTopic: topic,
                            lastDifficulty: difficulty,
                            lastTrack: track
                        })
                    }
                }}
            />
        )
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
            )
        }
        
        return (
            <RacePage
                topics={selectedTopic}
                difficulty={selectedDifficulty}
                trackId={selectedTrack}
                currentUser={currentUser}
                onExit={() => setScreen('menu')}
            />
        )
    }

    if (screen === 'login') {
        return (
            <LoginPage
                onPlayGuest={() => setScreen('difficulty')}
                onLogin={handleLogin}
                onBack={() => setScreen('menu')}
            />
        )
    }
}
