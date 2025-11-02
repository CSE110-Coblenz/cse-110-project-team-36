import { useState } from 'react'
import { RacePage } from './pages/RacePage'
//import { PlaceholderPage } from './pages/PlaceholderPage'
import { MainMenuPage } from './pages/MainMenuPage'
import { SignUpPage } from './pages/SignUpPage'
import DifficultySelectionScreen from './pages/DifficultySelectionScreen'

type Screen = 'menu' | 'race' | 'signup' | 'difficulty'

export default function App() {
    const [screen, setScreen] = useState<Screen>('menu')
    const [selectedTopic, setSelectedTopic] = useState<string>('')
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('')

    if (screen === 'menu') {
        return (
            <MainMenuPage
                onStart={() => setScreen('difficulty')}
                onSignUpClick={() => setScreen('signup')}
            />
        )
    }

    if (screen === 'difficulty') {
        return (
            <DifficultySelectionScreen
                onBack={() => setScreen('menu')}
                onStartRace={(topic, difficulty) => {
                    setSelectedTopic(topic)
                    setSelectedDifficulty(difficulty)
                    setScreen('race')
                }}
            />
        )
    }

    if (screen === 'race') {
        if (!selectedTopic || !selectedDifficulty) {
            console.error("Race screen accessed without topic or difficulty selected!")
            return (
                <MainMenuPage
                    onStart={() => setScreen('difficulty')}
                    onSignUpClick={() => setScreen('signup')}
                />
            )
        }
        
        return (
            <RacePage
                topics={selectedTopic}
                difficulty={selectedDifficulty}
                onExit={() => setScreen('menu')}
            />
        )
    }

    if (screen === 'signup') {
        return (
            <SignUpPage
                onPlayGuest={() => setScreen('difficulty')}
                onSignUp={(name: string, email: string, password: string) => {
                    console.log('SignUp:', name, email, password)
                    setScreen('menu')
                }}
                onBack={() => setScreen('menu')}
            />
        )
    }
}
