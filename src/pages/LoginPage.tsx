/**
 * LoginPage
 * Players can log in with existing account or create a new one.
 * Two-step flow: username first, then show login or signup fields.
 * Consistent neon-racing design with MainMenuPage.
 */

import React, { useState } from 'react'
import { userExists, getUser, saveUser, hashPassword, verifyPassword } from '../services/localStorage'
import type { UserProfile } from '../services/localStorage'

export const LoginPage: React.FC<{
    onPlayGuest: () => void
    onLogin: (username: string) => void
    onBack: () => void
}> = ({ onPlayGuest, onLogin, onBack }) => {
    const [step, setStep] = useState<'username' | 'login' | 'signup'>('username')
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState<string | null>(null)

    function handleContinue() {
        if (!username.trim()) {
            setError('Username is required')
            return
        }
        setError(null)

        const exists = userExists(username)
        setStep(exists ? 'login' : 'signup')
    }

    function handleChangeUsername() {
        setStep('username')
        setPassword('')
        setConfirmPassword('')
        setEmail('')
        setError(null)
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)

        if (step === 'login') {
            // Login flow
            const user = getUser(username)
            if (!user) {
                setError('User not found')
                return
            }

            if (!verifyPassword(password, user.passwordHash)) {
                setError('Incorrect password')
                return
            }

            onLogin(username)
        } else if (step === 'signup') {
            // Signup flow
            if (!email.trim() || !email.includes('@')) {
                setError('Valid email is required')
                return
            }

            if (password.length < 3) {
                setError('Password must be at least 3 characters')
                return
            }

            if (password !== confirmPassword) {
                setError('Passwords do not match')
                return
            }

            // Create new user
            const newUser: UserProfile = {
                username: username.trim(),
                email: email.trim(),
                passwordHash: hashPassword(password),
                stats: [],
                preferences: {},
                createdAt: Date.now()
            }

            saveUser(newUser)
            onLogin(username.trim())
        }
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
                fontFamily: '"Comic Sans MS","Baloo 2",system-ui,sans-serif',
                color: 'white',
                overflow: 'hidden',
            }}
        >
            {/* overlay for readability */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                        'radial-gradient(circle at 20% 20%, #fffb9e 0%, #ff6b00 30%, #1a0033 70%, #000 100%)',
                    zIndex: 0,
                }}
            />

            {/* card */}
            <div
                style={{
                    zIndex: 1,
                    background:
                        'linear-gradient(180deg,rgba(15,15,30,0.9) 0%,rgba(30,30,60,0.9) 100%)',
                    border: '3px solid #fff',
                    borderRadius: 24,
                    boxShadow:
                        '0 20px 40px rgba(0,0,0,0.8), 0 0 35px rgba(255,255,255,0.25)',
                    padding: 28,
                    width: '90%',
                    maxWidth: 380,
                    display: 'grid',
                    gap: 18,
                    textAlign: 'center',
                    animation: 'cardPulse 2s infinite',
                }}
            >
                <h1
                    style={{
                        margin: 0,
                        fontSize: '2.2rem',
                        fontWeight: 900,
                        color: '#fff',
                        textShadow:
                            '0 0 6px #ff0,0 0 12px #ff8000,0 0 24px #ff4000,0 0 36px #ff0000',
                        animation: 'bounceTitle 1.2s infinite',
                        letterSpacing: '0.05em',
                    }}
                >
                    FORMULA FUN 🏁
                </h1>

                <p
                    style={{
                        color: '#ffd6a8',
                        fontWeight: 600,
                        fontSize: '1rem',
                        margin: '-6px 0 6px 0',
                        textShadow: '0 0 4px #000',
                    }}
                >
                    {step === 'username' && 'Welcome!'}
                    {step === 'login' && 'Welcome Back!'}
                    {step === 'signup' && 'Join the Math Racers!'}
                </p>

                {/* form */}
                {step === 'username' ? (
                    <div style={{ display: 'grid', gap: 14, textAlign: 'left', marginBottom: 12 }}>
                        <div style={{ display: 'grid', gap: 4 }}>
                            <label style={labelStyle}>Username</label>
                            <input
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleContinue() }}
                                placeholder="SpeedBlaster99"
                                style={inputStyle}
                                autoFocus
                            />
                        </div>

                        {error && (
                            <div style={{
                                color: '#ff4444',
                                fontSize: '0.85rem',
                                textAlign: 'center',
                                padding: '8px',
                                background: 'rgba(255, 68, 68, 0.2)',
                                borderRadius: 8,
                                border: '1px solid rgba(255, 68, 68, 0.5)'
                            }}>
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleContinue}
                            style={{
                                ...btnBlue,
                                marginTop: 8,
                            }}
                        >
                            Continue
                        </button>
                    </div>
                ) : (
                    <form
                        onSubmit={handleSubmit}
                        style={{
                            display: 'grid',
                            gap: 14,
                            textAlign: 'left',
                            marginBottom: 12,
                        }}
                    >
                        <div style={{ display: 'grid', gap: 4 }}>
                            <label style={labelStyle}>Username</label>
                            <input
                                value={username}
                                disabled
                                style={{
                                    ...inputStyle,
                                    opacity: 0.6,
                                    cursor: 'not-allowed'
                                }}
                            />
                        </div>

                        {step === 'signup' && (
                            <div style={{ display: 'grid', gap: 4 }}>
                                <label style={labelStyle}>Email</label>
                                <input
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    style={inputStyle}
                                    type="email"
                                />
                            </div>
                        )}

                        <div style={{ display: 'grid', gap: 4 }}>
                            <label style={labelStyle}>Password</label>
                            <input
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••"
                                style={inputStyle}
                                type="password"
                                autoFocus
                            />
                        </div>

                        {step === 'signup' && (
                            <div style={{ display: 'grid', gap: 4 }}>
                                <label style={labelStyle}>Confirm Password</label>
                                <input
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="••••••"
                                    style={inputStyle}
                                    type="password"
                                />
                            </div>
                        )}

                        {error && (
                            <div style={{
                                color: '#ff4444',
                                fontSize: '0.85rem',
                                textAlign: 'center',
                                padding: '8px',
                                background: 'rgba(255, 68, 68, 0.2)',
                                borderRadius: 8,
                                border: '1px solid rgba(255, 68, 68, 0.5)'
                            }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            style={{
                                ...btnBlue,
                                marginTop: 8,
                            }}
                        >
                            {step === 'login' ? 'Login' : 'Sign Up'}
                        </button>

                        <button
                            type="button"
                            onClick={handleChangeUsername}
                            style={{
                                ...btnGray,
                                fontSize: '0.9rem',
                            }}
                        >
                            ← Change Username
                        </button>
                    </form>
                )}

                {step === 'username' && (
                    <button onClick={onPlayGuest} style={btnYellow}>
                        Play as Guest
                    </button>
                )}

                {step === 'username' && (
                    <button onClick={onBack} style={btnGray}>
                        Back
                    </button>
                )}

                <p
                    style={{
                        fontSize: '0.75rem',
                        color: '#9ca3af',
                        marginTop: 6,
                        textShadow: '0 0 4px #000',
                    }}
                >
                    {step === 'username' && 'Enter your username to get started'}
                    {step === 'login' && 'Continue your racing journey!'}
                    {step === 'signup' && 'Your progress will be saved to your racer profile.'}
                </p>
            </div>

            <style>
                {`
          @keyframes bounceTitle {
            0%,100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }
          @keyframes cardPulse {
            0%,100% { box-shadow: 0 20px 40px rgba(0,0,0,0.8),0 0 20px rgba(255,255,255,0.15); }
            50% { box-shadow: 0 20px 40px rgba(0,0,0,0.8),0 0 35px rgba(255,255,255,0.35); }
          }
          button:hover {
            transform: scale(1.05);
            transition: transform 0.15s ease;
          }
          button:active {
            transform: scale(0.95);
          }
          input:focus {
            outline: none;
            box-shadow: 0 0 8px 2px rgba(0,255,255,0.8),0 0 24px rgba(0,255,170,0.5);
          }
        `}
            </style>
        </div>
    )
}

/* === shared styles matching MainMenuPage === */

const labelStyle: React.CSSProperties = {
    color: '#fff',
    fontWeight: 700,
    fontSize: '0.8rem',
    textShadow: '0 0 4px #000',
}

const inputStyle: React.CSSProperties = {
    padding: '10px 12px',
    borderRadius: 12,
    border: '2px solid #00ffd5',
    backgroundColor: '#0f172a',
    color: 'white',
    fontWeight: 600,
    fontSize: '0.9rem',
    boxShadow: '0 0 6px rgba(0,255,255,0.4)',
}

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
    background: 'linear-gradient(90deg,#ffef00 0%,#ff9a00 50%,#ff2a00 100%)',
    boxShadow: '0 8px 16px rgba(255,180,0,0.5),0 0 12px rgba(255,100,0,0.6)',
}

const btnBlue: React.CSSProperties = {
    ...btnBase,
    background: 'linear-gradient(90deg,#00ff95 0%,#00d4ff 50%,#0077ff 100%)',
    boxShadow: '0 8px 16px rgba(0,255,200,0.4),0 0 12px rgba(0,255,255,0.6)',
}

const btnGray: React.CSSProperties = {
    ...btnBase,
    background: 'linear-gradient(90deg,#555 0%,#333 100%)',
    color: '#fff',
    boxShadow: '0 4px 8px rgba(0,0,0,0.6)',
}
