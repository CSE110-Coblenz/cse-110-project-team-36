import React, { useState, useEffect, useRef, useCallback } from "react";
import { QuestionManager } from "../../game/managers/QuestionManager";
import { NumberInputListener, EnterSubmitListener, DeleteListener, SkipQuestionListener } from "../../game/listeners/KeyboardListener";

type FeedbackState = 'none' | 'correct' | 'incorrect';

interface QuestionAnswerProps {
    questionManager: QuestionManager | null;
}

export function QuestionAnswer({ questionManager }: QuestionAnswerProps) {
  const [answer, setAnswer] = useState("");

  const [feedback, setFeedback] = useState<FeedbackState>('none');
  const feedbackTimeoutRef = useRef<number>(0);

  const [currentQuestion, setCurrentQuestion] = useState(
    () => questionManager?.getCurrentQuestion() || ""
  );

  const handleSubmit = useCallback(() => {
    if (!questionManager) return;
    if (answer.trim() === "" || answer === "-" || answer === "." || answer === "-.") return;
    
    const numAnswer = Number(answer);
    const wasCorrect = questionManager.submitAnswer(numAnswer);
    
    setFeedback(wasCorrect ? 'correct' : 'incorrect');
    
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    feedbackTimeoutRef.current = window.setTimeout(() => {
      setFeedback('none');
    }, 750);
    
    setCurrentQuestion(questionManager.getCurrentQuestion());
    setAnswer("");
  }, [answer, questionManager]);

  const handleSkip = useCallback(() => {
    questionManager.skipQuestion();
    setCurrentQuestion(questionManager.getCurrentQuestion());
    setAnswer("");
    // Reset feedback when skipping
    setFeedback('none');
  }, [questionManager]);

  useEffect(() => {
    const handleNumberInput = (char: string) => {
      setAnswer(prev => prev + char);
    };

    const numberListener = new NumberInputListener(handleNumberInput);
    numberListener.start();

    return () => {
      numberListener.stop();
    };
  }, []);

  useEffect(() => {
    const handleDelete = () => {
      setAnswer(prev => prev.slice(0, -1));
    };

    const deleteListener = new DeleteListener(handleDelete);
    deleteListener.start();

    return () => {
      deleteListener.stop();
    };
  }, []);

  useEffect(() => {
    const enterListener = new EnterSubmitListener(() => {
      handleSubmit();
    });
    enterListener.start();

    return () => {
      enterListener.stop();
    };
  }, [handleSubmit]);

  useEffect(() => {
    const skipListener = new SkipQuestionListener(() => {
      handleSkip();
    });
    skipListener.start();

    return () => {
      skipListener.stop();
    };
  }, [handleSkip]);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  const getFeedbackStyle = (): React.CSSProperties => {
    switch (feedback) {
      case 'correct':
        return {
          background: "rgba(34, 197, 94, 0.95)", // Green
          border: "2px solid rgba(74, 222, 128, 0.8)",
        };
      case 'incorrect':
        return {
          background: "rgba(239, 68, 68, 0.95)", // Red
          border: "2px solid rgba(248, 113, 113, 0.8)",
        };
      default:
        return {
          background: "rgba(15, 23, 42, 0.95)",
          border: "2px solid rgba(148, 163, 184, 0.3)",
        };
    }
  };

  return (
    <div>
      <form
        style={{
          position: "absolute",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          ...getFeedbackStyle(),
          padding: "1.5em 2em",
          borderRadius: "16px",
          color: "white",
          zIndex: 10,
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
          transition: "all 0.3s ease",
        }}
      >
        <div style={{ fontSize: "1.3em", marginBottom: "0.75em", fontWeight: 500 }}>
          {feedback === 'correct' && '✅ '}
          {feedback === 'incorrect' && '❌ '}
          Solve: <b style={{ color: feedback === 'none' ? "#60a5fa" : "white" }}>{currentQuestion}</b>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div
            style={{
              width: "120px",
              padding: "12px 16px",
              fontSize: "1.2em",
              borderRadius: "8px",
              border: "2px solid rgba(148, 163, 184, 0.3)",
              background: "rgba(30, 41, 59, 0.8)",
              color: answer ? "white" : "rgba(148, 163, 184, 0.5)",
              minHeight: "1.2em",
              display: "flex",
              alignItems: "center",
            }}
          >
            {answer || "?"}
          </div>
          <button 
            type="button"
            onClick={handleSubmit}
            style={{
              padding: "12px 24px",
              fontSize: "1.1em",
              fontWeight: 600,
              borderRadius: "8px",
              border: "none",
              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              color: "white",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 6px rgba(59, 130, 246, 0.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 12px rgba(59, 130, 246, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 6px rgba(59, 130, 246, 0.3)";
            }}
          >
            Submit (Enter)
          </button>
          <button 
            type="button"
            onClick={handleSkip}
            style={{
              padding: "12px 24px",
              fontSize: "1.1em",
              fontWeight: 600,
              borderRadius: "8px",
              border: "2px solid rgba(239, 68, 68, 0.5)",
              background: "rgba(239, 68, 68, 0.1)",
              color: "rgba(239, 68, 68, 1)",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
            }}
          >
            Skip (S)
          </button>
        </div>
      </form>
    </div>
  );
}
