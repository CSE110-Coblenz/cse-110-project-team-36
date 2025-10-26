import React, { useState } from "react";
// import { Stage, Layer, Line, Group, Rect } from "react-konva";
import { QuestionManager } from "../../game/managers/QuestionManager";

export function QuestionAnswer() {
  const [answer, setAnswer] = useState("");
  const [questionManager] = useState(() => new QuestionManager());
  const [currentQuestion, setCurrentQuestion] = useState(
    questionManager.generateQuestion()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answer.trim() === "") return;
    questionManager.submitAnswer(Number(answer));
    setCurrentQuestion(questionManager.generateQuestion());
    setAnswer("");
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        style={{
          position: "absolute",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(255,255,255,0.1)",
          padding: "1em 2em",
          borderRadius: "12px",
          color: "white",
          zIndex: 10,
        }}
      >
        <div style={{ fontSize: "1.2em", marginBottom: "0.5em" }}>
          Solve: <b>{currentQuestion}</b>
        </div>
        <input
          type="number"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          style={{
            width: "80px",
            marginRight: "8px",
            padding: "4px 6px",
            fontSize: "1em",
          }}
        />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}
