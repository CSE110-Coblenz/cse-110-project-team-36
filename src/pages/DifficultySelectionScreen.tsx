import React, { useState } from "react";
import { AVAILABLE_TRACKS } from "../utils/trackList";

interface DifficultySelectionScreenProps {
  onBack: () => void;
  onStartRace: (topic: string, difficulty: string, track: string) => void;
}

const DifficultySelectionScreen: React.FC<DifficultySelectionScreenProps> = ({
  onBack,
  onStartRace,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);

  const topics = ["Addition", "Subtraction", "Multiplication", "Division"];
  const difficulties = ["Easy", "Medium", "Hard"];

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
  };

  const handleDifficultySelect = (level: string) => {
    setSelectedDifficulty(level);
  };

  const handleTrackSelect = (trackId: string) => {
    setSelectedTrack(trackId);
  };

  const handleStart = () => {
    if (selectedTopic && selectedDifficulty && selectedTrack) {
      onStartRace(selectedTopic, selectedDifficulty, selectedTrack);
    }
  };

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
        fontFamily: '"Comic Sans MS", "Baloo 2", system-ui, sans-serif',
        overflow: 'hidden',
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
          background:
            'linear-gradient(180deg, rgba(15,15,30,0.95) 0%, rgba(30,30,60,0.95) 100%)',
          border: '3px solid #fff',
          borderRadius: 24,
          boxShadow:
            '0 20px 40px rgba(0,0,0,0.8), 0 0 40px rgba(255,255,255,0.2)',
          padding: 32,
          width: '90%',
          maxWidth: 700,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          textAlign: 'center',
          animation: 'cardPulse 2s infinite',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={onBack}
            style={{
              padding: '8px 16px',
              borderRadius: 12,
              border: '2px solid #fff',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            ← Back
          </button>
          <h1
            style={{
              fontSize: '2rem',
              margin: 0,
              fontWeight: 900,
              color: '#fff',
              textShadow:
                '0 0 6px #ff0, 0 0 12px #ff8000, 0 0 24px #ff4000, 0 0 36px #ff0000',
              letterSpacing: '0.05em',
            }}
          >
            Race Setup
          </h1>
          <div style={{ width: 80 }}></div>
        </div>

        {/* Topic Selection */}
        <div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffd6a8', marginBottom: 12, textShadow: '0 0 4px #000' }}>
            Choose Your Math Topic
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            {topics.map((topic) => (
              <button
                key={topic}
                onClick={() => handleTopicSelect(topic)}
                style={{
                  padding: '12px 24px',
                  borderRadius: 16,
                  border: selectedTopic === topic ? '3px solid #00ffd5' : '2px solid #00ffd5',
                  background: selectedTopic === topic
                    ? 'linear-gradient(90deg,#00ff95 0%,#00d4ff 50%,#0077ff 100%)'
                    : 'rgba(0,255,213,0.1)',
                  color: selectedTopic === topic ? '#000' : '#00ffd5',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: selectedTopic === topic
                    ? '0 8px 16px rgba(0,255,200,0.5), 0 0 12px rgba(0,255,255,0.6)'
                    : '0 4px 8px rgba(0,255,213,0.3)',
                }}
                onMouseEnter={(e) => {
                  if (selectedTopic !== topic) {
                    e.currentTarget.style.background = 'rgba(0,255,213,0.2)'
                    e.currentTarget.style.transform = 'scale(1.05)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedTopic !== topic) {
                    e.currentTarget.style.background = 'rgba(0,255,213,0.1)'
                    e.currentTarget.style.transform = 'scale(1)'
                  }
                }}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Selection */}
        <div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffd6a8', marginBottom: 12, textShadow: '0 0 4px #000' }}>
            Choose Difficulty
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            {difficulties.map((level) => (
              <button
                key={level}
                onClick={() => handleDifficultySelect(level)}
                style={{
                  padding: '12px 24px',
                  borderRadius: 16,
                  border: selectedDifficulty === level ? '3px solid #a8ff00' : '2px solid #a8ff00',
                  background: selectedDifficulty === level
                    ? 'linear-gradient(90deg,#a8ff00 0%,#5cff00 50%,#00ff88 100%)'
                    : 'rgba(168,255,0,0.1)',
                  color: selectedDifficulty === level ? '#000' : '#a8ff00',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: selectedDifficulty === level
                    ? '0 8px 16px rgba(100,255,100,0.5), 0 0 12px rgba(0,255,150,0.5)'
                    : '0 4px 8px rgba(168,255,0,0.3)',
                }}
                onMouseEnter={(e) => {
                  if (selectedDifficulty !== level) {
                    e.currentTarget.style.background = 'rgba(168,255,0,0.2)'
                    e.currentTarget.style.transform = 'scale(1.05)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedDifficulty !== level) {
                    e.currentTarget.style.background = 'rgba(168,255,0,0.1)'
                    e.currentTarget.style.transform = 'scale(1)'
                  }
                }}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Track Selection */}
        <div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffd6a8', marginBottom: 12, textShadow: '0 0 4px #000' }}>
            Choose Your Track
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            {AVAILABLE_TRACKS.map((track) => (
              <button
                key={track.id}
                onClick={() => handleTrackSelect(track.id)}
                style={{
                  padding: '12px 24px',
                  borderRadius: 16,
                  border: selectedTrack === track.id ? '3px solid #ffef00' : '2px solid #ffef00',
                  background: selectedTrack === track.id
                    ? 'linear-gradient(90deg,#ffef00 0%,#ff9a00 50%,#ff2a00 100%)'
                    : 'rgba(255,239,0,0.1)',
                  color: selectedTrack === track.id ? '#000' : '#ffef00',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: selectedTrack === track.id
                    ? '0 8px 16px rgba(255,180,0,0.5), 0 0 12px rgba(255,100,0,0.6)'
                    : '0 4px 8px rgba(255,239,0,0.3)',
                }}
                onMouseEnter={(e) => {
                  if (selectedTrack !== track.id) {
                    e.currentTarget.style.background = 'rgba(255,239,0,0.2)'
                    e.currentTarget.style.transform = 'scale(1.05)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedTrack !== track.id) {
                    e.currentTarget.style.background = 'rgba(255,239,0,0.1)'
                    e.currentTarget.style.transform = 'scale(1)'
                  }
                }}
              >
                {track.name}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: 8 }}>
            {AVAILABLE_TRACKS.find(t => t.id === selectedTrack)?.description || ''}
          </div>
        </div>

        {/* Start Race Button */}
        <button
          onClick={handleStart}
          disabled={!selectedTopic || !selectedDifficulty || !selectedTrack}
          style={{
            padding: '16px 32px',
            borderRadius: 16,
            border: selectedTopic && selectedDifficulty && selectedTrack ? '3px solid #fff' : '2px solid #666',
            background: selectedTopic && selectedDifficulty && selectedTrack
              ? 'linear-gradient(90deg,#ffef00 0%,#ff9a00 50%,#ff2a00 100%)'
              : 'rgba(100,100,100,0.3)',
            color: selectedTopic && selectedDifficulty && selectedTrack ? '#000' : '#666',
            fontSize: '1.3rem',
            fontWeight: 900,
            cursor: selectedTopic && selectedDifficulty && selectedTrack ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
            boxShadow: selectedTopic && selectedDifficulty && selectedTrack
              ? '0 8px 16px rgba(255,180,0,0.5), 0 0 12px rgba(255,100,0,0.6)'
              : 'none',
          }}
          onMouseEnter={(e) => {
            if (selectedTopic && selectedDifficulty && selectedTrack) {
              e.currentTarget.style.transform = 'scale(1.05)'
            }
          }}
          onMouseLeave={(e) => {
            if (selectedTopic && selectedDifficulty && selectedTrack) {
              e.currentTarget.style.transform = 'scale(1)'
            }
          }}
        >
          Start Race
        </button>
      </div>

      {/* animations */}
      <style>
        {`
          @keyframes cardPulse {
            0%, 100% { box-shadow: 0 20px 40px rgba(0,0,0,0.8), 0 0 20px rgba(255,255,255,0.15); }
            50% { box-shadow: 0 20px 40px rgba(0,0,0,0.8), 0 0 35px rgba(255,255,255,0.35); }
          }
        `}
      </style>
    </div>
  );
};

export default DifficultySelectionScreen;
