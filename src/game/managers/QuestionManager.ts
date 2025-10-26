import { events } from "../../shared/events";

export class QuestionManager {
  private currentQuestion: string = "";
  private correctAnswer: number = 0;

  constructor() {
    this.generateQuestion();
  }

  // Generate a new random math question
  generateQuestion() {
    const a = Math.floor(Math.random() * 10);
    const b = Math.floor(Math.random() * 10);
    const operations = ["+", "-", "*", "/"];
    const operation = operations[Math.floor(Math.random() * operations.length)];

    this.currentQuestion = `${a} ${operation} ${b}`;
    switch (operation) {
      case "+":
        this.correctAnswer = a + b;
        break;
      case "-":
        this.correctAnswer = a - b;
        break;
      case "*":
        this.correctAnswer = a * b;
        break;
      case "/":
        this.correctAnswer = parseFloat((a / b).toFixed(2)); // round to 2 decimals
        break;
    }

    console.log(`New Question: ${this.currentQuestion}`);
    return this.currentQuestion;
  }

  // Called when player submits an answer
  submitAnswer(answer: number) {
    if (answer === this.correctAnswer) {
      console.log("✅ Correct!");
      events.emit("AnsweredCorrectly", {
        question: this.currentQuestion,
        answer,
      });
    } else {
      console.log(
        `❌ Incorrect (expected ${this.correctAnswer}, got ${answer})`
      );
      events.emit("AnsweredIncorrectly", {
        question: this.currentQuestion,
        answer,
      });
    }

    // After every answer, ask a new question
    this.generateQuestion();
  }
}
