import { useState } from 'react'
import { RacePage } from './pages/RacePage'
import { PlaceholderPage } from './pages/PlaceholderPage'

type Screen = 'menu' | 'race'

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  return screen === 'menu'
    ? <PlaceholderPage onStart={() => setScreen('race')} />
    : <RacePage onExit={() => setScreen('menu')} />
}
