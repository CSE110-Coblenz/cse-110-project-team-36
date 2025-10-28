/******
import React from 'react'

export const PlaceholderPage: React.FC<{ onStart: () => void }> = ({ onStart }) => {
    return (
        <div style={{
            display: 'grid', placeItems: 'center', height: '100vh',
            background: 'linear-gradient(180deg,#0b1020 0%,#1f2937 100%)', color: 'white'
        }}>
            <div style={{ display: 'grid', gap: 16, minWidth: 320, textAlign: 'center' }}>
                <h1 style={{ margin: 0 }}>Formula Fun</h1>

                <button
                    onClick={onStart}
                    style={{
                        padding: '12px 16px', borderRadius: 8, border: '1px solid #94a3b8',
                        background: '#111827', color: 'white', fontWeight: 600, cursor: 'pointer'
                    }}
                >
                    ▶ Start Race
                </button>
            </div>
        </div>
    )
}
****/