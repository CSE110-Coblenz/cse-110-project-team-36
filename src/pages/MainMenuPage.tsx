/**
 * MainMenuPage
 * 
 * The landing screen 
 * Players can choose to play as guest, create an account, 
 * start campaign, or adjust options sound/fullscreen.
 */

import React, { useState } from 'react'

export const MainMenuPage: React.FC<{
  currentUser: string | null
  onStart: () => void
  onSignUpClick: () => void
  onLogout: () => void
  onCampaignClick: () => void
}> = ({ currentUser, onStart, onSignUpClick, onLogout, onCampaignClick }) => {
  const [soundOn, setSoundOn] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)

  const toggleSound = () => setSoundOn(!soundOn)

  const toggleFullscreen = () => {
    if (!fullscreen) {
      document.documentElement.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
    setFullscreen(!fullscreen)
  }

  return (
    <div
      style={{
        height: '100vh',
        display: 'grid',
        placeItems: 'center',
        backgroundImage: 'url("/backgrounds/race-track-bg.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '"Comic Sans MS", "Baloo 2", system-ui, sans-serif',
      }}
    >
      {/* translucent overlay for readability */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
          'radial-gradient(circle at 20% 20%, #fffb9e 0%, #ff6b00 30%, #1a0033 70%, #000 100%)',
          zIndex: 0,
        }}
      />

      {/* main content */}
      <div
        style={{
          zIndex: 1,
          position: 'relative',
          background:
            'linear-gradient(180deg, rgba(15,15,30,0.9) 0%, rgba(30,30,60,0.9) 100%)',
          border: '3px solid #fff',
          borderRadius: 24,
          boxShadow:
            '0 20px 40px rgba(0,0,0,0.8), 0 0 40px rgba(255,255,255,0.2)',
          padding: 28,
          width: '90%',
          maxWidth: 380,
          display: 'grid',
          gap: 20,
          textAlign: 'center',
          animation: 'cardPulse 2s infinite',
        }}
      >
        {/* Logout button in top-right corner */}
        {currentUser && (
          <button
            onClick={onLogout}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid #ff4444',
              background: 'rgba(255, 68, 68, 0.2)',
              color: '#ff6666',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 68, 68, 0.4)'
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 68, 68, 0.2)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            Logout
          </button>
        )}

        {/* animated title */}
        <h1
          style={{
            fontSize: '2.3rem',
            margin: 0,
            fontWeight: 900,
            color: '#fff',
            textShadow:
              '0 0 6px #ff0, 0 0 12px #ff8000, 0 0 24px #ff4000, 0 0 36px #ff0000',
            letterSpacing: '0.05em',
            animation: 'bounceTitle 1.2s infinite',
          }}
        >
        FORMULA FUN 🏁 
        </h1>

        {currentUser && (
          <p
            style={{
              color: '#00ffd5',
              fontWeight: 700,
              fontSize: '1.1rem',
              textShadow: '0 0 8px #00ffd5, 0 0 4px #000',
              marginTop: -12,
              marginBottom: 4,
            }}
          >
            Welcome, {currentUser}! 🏎️
          </p>
        )}

        <p
          style={{
            color: '#ffd6a8',
            fontWeight: 600,
            fontSize: '1rem',
            textShadow: '0 0 4px #000',
            marginTop: currentUser ? -8 : -8,
            marginBottom: 12,
          }}
        >
          Play, Learn, Fun!
        </p>

        {/* buttons */}
        <button style={btnYellow} onClick={onStart}>
          ▶ Start Race
        </button>

        <button style={btnPurple} onClick={onCampaignClick}>
          🏆 Campaign Mode
        </button>

        <button style={btnBlue} onClick={onSignUpClick}>
          {currentUser ? 'Switch Account' : 'Create Account'}
        </button>

        <button style={btnGreen} onClick={toggleSound}>
          {soundOn ? 'Sound: ON' : 'Sound: OFF'}
        </button>

        <button style={btnGray} onClick={toggleFullscreen}>
          {fullscreen ? 'Exit Full Screen' : 'Full Screen'}
        </button>

        {/* footer */}
        <p
          style={{
            fontSize: '0.8rem',
            marginTop: 12,
            color: '#9ca3af',
            textShadow: '0 0 4px #000',
          }}
        >
        </p>
      </div>

      {/* animations */}
      <style>
        {`
          @keyframes bounceTitle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }

          @keyframes cardPulse {
            0%, 100% { box-shadow: 0 20px 40px rgba(0,0,0,0.8), 0 0 20px rgba(255,255,255,0.15); }
            50% { box-shadow: 0 20px 40px rgba(0,0,0,0.8), 0 0 35px rgba(255,255,255,0.35); }
          }

          button:hover {
            transform: scale(1.05);
            transition: transform 0.15s ease;
          }

          button:active {
            transform: scale(0.95);
          }
        `}
      </style>
    </div>
  )
}

// Button styles (consistent with SignUpPage)
const btnBase: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: 16,
  border: '2px solid #fff',
  fontWeight: 800,
  fontSize: '1rem',
  color: '#000',
  cursor: 'pointer',
  textShadow: '0 0 4px rgba(255,255,255,0.6)',
  transition: 'transform 0.12s ease',
  WebkitTapHighlightColor: 'transparent',
}

const btnYellow: React.CSSProperties = {
  ...btnBase,
  background:
    'linear-gradient(90deg,#ffef00 0%,#ff9a00 50%,#ff2a00 100%)',
  boxShadow: '0 8px 16px rgba(255,180,0,0.5), 0 0 12px rgba(255,100,0,0.6)',
}

const btnPurple: React.CSSProperties = {
  ...btnBase,
  background:
    'linear-gradient(90deg,#ff00cc 0%,#cc00ff 50%,#6600ff 100%)',
  boxShadow: '0 8px 16px rgba(255,0,200,0.5), 0 0 12px rgba(200,0,255,0.6)',
}

const btnBlue: React.CSSProperties = {
  ...btnBase,
  background:
    'linear-gradient(90deg,#00ff95 0%,#00d4ff 50%,#0077ff 100%)',
  boxShadow: '0 8px 16px rgba(0,255,200,0.4), 0 0 12px rgba(0,255,255,0.6)',
}

const btnGreen: React.CSSProperties = {
  ...btnBase,
  background:
    'linear-gradient(90deg,#a8ff00 0%,#5cff00 50%,#00ff88 100%)',
  boxShadow: '0 8px 16px rgba(100,255,100,0.5), 0 0 12px rgba(0,255,150,0.5)',
}

const btnGray: React.CSSProperties = {
  ...btnBase,
  background:
    'linear-gradient(90deg,#555 0%,#333 100%)',
  color: '#fff',
  boxShadow: '0 4px 8px rgba(0,0,0,0.6)',
}
