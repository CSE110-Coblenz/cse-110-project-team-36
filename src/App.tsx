import { useState } from 'react'
import { RacePage } from './pages/RacePage'
//import { PlaceholderPage } from './pages/PlaceholderPage'
import { MainMenuPage } from './pages/MainMenuPage'
import { SignUpPage } from './pages/SignUpPage'

type Screen = 'menu' | 'race' | 'signup'

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  if (screen === 'menu')
    return <MainMenuPage 
      onStart={() => setScreen('race')} onSignUpClick={() => setScreen('signup')}/>
  
  if (screen === 'race')
    return <RacePage onExit={() => setScreen('menu')}/>
  
  if (screen === 'signup')
    return <SignUpPage 
      onPlayGuest={() => setScreen('race')}
      onSignUp={(name: string, email: string, password: string) => {
        // handle sign-up (placeholder)
        console.log('SignUp:', name, email)
        setScreen('menu')
      }}
      onBack={() => setScreen('menu')}
    />
  

}
