/**
 * LevelSelectionPage (VIEW)
 */

import React, { useState } from "react"
import { LevelSelectionController } from "../game/controllers/LevelSelectionController"
import type { Level } from "../game/models/LevelModel"

export const LevelSelectionPage: React.FC<{
  onBack: () => void
  onLevelSelect: (level: Level) => void
  currentUser: string | null
  controller: LevelSelectionController
}> = ({ onBack, onLevelSelect, currentUser, controller }) => {
  const [index, setIndex] = useState(0)

  const currentLevel = controller.getCurrentLevel()

  const goNext = () => {
    setIndex(controller.nextLevel())
  }

  const goPrev = () => {
    setIndex(controller.prevLevel())
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "grid",
        placeItems: "center",
        backgroundImage: 'url("/backgrounds/race-track-bg.jpg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        position: "relative",
        fontFamily: '"Comic Sans MS", "Baloo 2", system-ui, sans-serif',
        overflow: "hidden"
      }}
    >
      {/* translucent overlay */}
      <div
        style={{
          position: "absolute",
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
          position: "relative",
          background:
            "linear-gradient(180deg, rgba(15,15,30,0.9) 0%, rgba(30,30,60,0.9) 100%)",
          border: "3px solid #fff",
          borderRadius: 20,
          boxShadow: "0 20px 40px rgba(0,0,0,0.8), 0 0 40px rgba(255,255,255,0.2)",
          padding: "30px 40px",
          width: "85%",
          maxWidth: "700px",
          textAlign: "center",
          animation: "cardPulse 2s infinite",
        }}
      >
        {/* Back Button */}
        <button
          onClick={onBack}
          style={{
            position: "absolute",
            top: "15px",
            left: "15px",
            background: "linear-gradient(45deg, #FF6B6B, #FF8E53)",
            border: "2px solid #fff",
            borderRadius: "10px",
            padding: "8px 14px",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
            fontSize: "0.9rem",
            boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
          }}
        >
          ← Back
        </button>

        {/* Header */}
        <div style={{ marginBottom: "25px" }}>
          <h1
            style={{
              margin: "0 0 8px 0",
              fontSize: "2rem",
              fontWeight: 900,
              color: "#fff",
              textShadow:
                "0 0 6px #ff0, 0 0 12px #ff8000, 0 0 24px #ff4000, 0 0 36px #ff0000",
              letterSpacing: "0.05em",
              animation: "bounceTitle 1.2s infinite",
            }}
          >
            🏆 CAMPAIGN MODE
          </h1>

          {currentUser && (
            <p
              style={{
                color: "#00ffd5",
                fontWeight: 700,
                fontSize: "1rem",
                textShadow: "0 0 8px #00ffd5, 0 0 4px #000",
                marginTop: -6,
                marginBottom: 6,
              }}
            >
              Welcome, {currentUser}! 🏎️
            </p>
          )}

          <p
            style={{
              color: "#ffd6a8",
              fontWeight: 600,
              fontSize: "0.9rem",
              textShadow: "0 0 4px #000",
              marginTop: currentUser ? -4 : 0,
              marginBottom: 0,
            }}
          >
            Level {index + 1} of {controller.getTotalLevels()}
          </p>
        </div>

        {/* Level Display */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
            marginBottom: "25px",
          }}
        >
          {/* Left Arrow */}
          <button
            onClick={goPrev}
            style={{
              background: "linear-gradient(45deg, #667eea, #764ba2)",
              border: "2px solid #fff",
              borderRadius: "50%",
              width: "50px",
              height: "50px",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "1.3rem",
              boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ‹
          </button>

          {/* Level Card */}
          <div
            style={{
              flex: 1,
              background:
                "linear-gradient(180deg, rgba(25,25,45,0.9) 0%, rgba(40,40,70,0.9) 100%)",
              border: "2px solid #fff",
              borderRadius: "16px",
              padding: "25px",
              textAlign: "center",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              minHeight: "320px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                fontSize: "3rem",
                fontWeight: "bold",
                background: "linear-gradient(45deg, #FF6B6B, #FF8E53, #FFD166, #06D6A0)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
                marginBottom: "8px",
                textShadow: "0 2px 4px rgba(0,0,0,0.2)",
              }}
            >
              {index + 1}
            </div>

            <h2 style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: "#fff",
              margin: "0 0 12px 0",
              textShadow: "0 2px 4px rgba(0,0,0,0.5)",
            }}>{currentLevel.name}</h2>

            <div
              style={{
                display: "inline-block",
                padding: "6px 16px",
                borderRadius: "16px",
                color: "white",
                fontWeight: "bold",
                fontSize: "0.9rem",
                marginBottom: "15px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.3)",
                background: controller.getDifficultyColor(currentLevel.difficulty),
              }}
            >
              {controller.getDifficultyText(currentLevel.difficulty)}
            </div>

            <p
              style={{
                color: "#ffd6a8",
                fontSize: "0.95rem",
                margin: "0 0 20px 0",
                lineHeight: "1.4",
                fontWeight: "600",
                textShadow: "0 0 4px #000",
                minHeight: "40px",
              }}
            >
              {currentLevel.description}
            </p>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "12px",
              fontSize: "0.8rem",
              color: "#b0b0b0",
              margin: "15px 0",
              padding: "12px",
              background: "rgba(0,0,0,0.3)",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.1)",
            }}>
              <div>
                <div style={{ fontSize: "1rem", marginBottom: "4px" }}>🎯</div>
                <div>{controller.getTopicName(currentLevel.topic)}</div>
                <div style={{ fontSize: "1.2rem", fontWeight: "bold", marginTop: "2px" }}>
                  {controller.getTopicSymbol(currentLevel.topic)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "1rem", marginBottom: "4px" }}>📊</div>
                <div>Difficulty</div>
                <div style={{ fontWeight: "bold", marginTop: "2px" }}>
                  {controller.getDifficultyText(currentLevel.difficulty)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "1rem", marginBottom: "4px" }}>🏁</div>
                <div>Track</div>
                <div style={{ fontWeight: "bold", marginTop: "2px" }}>
                  {currentLevel.track.toUpperCase()}
                </div>
              </div>
            </div>

            <button
              style={{
                width: "100%",
                padding: "12px",
                background: "linear-gradient(90deg,#ffef00 0%,#ff9a00 50%,#ff2a00 100%)",
                border: "2px solid #fff",
                borderRadius: "12px",
                color: "#000",
                fontWeight: 800,
                fontSize: "1rem",
                cursor: "pointer",
                boxShadow: "0 8px 16px rgba(255,180,0,0.5), 0 0 12px rgba(255,100,0,0.6)",
                textShadow: "0 0 4px rgba(255,255,255,0.6)",
                marginTop: "15px",
              }}
              onClick={() => onLevelSelect(currentLevel)}
            >
              START LEVEL {index + 1}
            </button>
          </div>

          {/* Right Arrow */}
          <button
            onClick={goNext}
            style={{
              background: "linear-gradient(45deg, #667eea, #764ba2)",
              border: "2px solid #fff",
              borderRadius: "50%",
              width: "50px",
              height: "50px",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "1.3rem",
              boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ›
          </button>
        </div>

        {/* Level Progress Dots */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "8px",
          marginTop: "15px",
          flexWrap: "wrap",
        }}>
          {Array.from({ length: controller.getTotalLevels() }).map((_, i) => (
            <div
              key={i}
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: i === index ? "#ffef00" : "rgba(255,255,255,0.3)",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </div>

      {/* animations */}
      <style>{`
        @keyframes bounceTitle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes cardPulse {
          0%, 100% { box-shadow: 0 20px 40px rgba(0,0,0,0.8), 0 0 20px rgba(255,255,255,0.15); }
          50% { box-shadow: 0 20px 40px rgba(0,0,0,0.8), 0 0 35px rgba(255,255,255,0.35); }
        }
      `}</style>
    </div>
  )
}

export default LevelSelectionPage
