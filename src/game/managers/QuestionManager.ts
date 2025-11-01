import { events } from "../../shared/events";

// Difficulty ranges for question generation
const difficultyRanges: Record<string, [number, number]> = {
  Easy: [0, 10],
  Medium: [11, 20],
  Hard: [21, 30],
};

// Operations allowed for each topic
const topicOperations: Record<string, string[]> = {
  Addition: ["+"],
  Subtraction: ["-"],
  Multiplication: ["*"],
  Division: ["/"],
};


export class QuestionManager {
    private currentQuestion: string = "";
    private correctAnswer: number = 0;
    private topic: string = "Addition";
    private difficulty: string = "Easy";

    constructor(topic?: string, difficulty?: string) {
        if (topic) this.topic = topic;
        if (difficulty) this.difficulty = difficulty;
        this.generateQuestion();
    }

    setTopic(topic: string) {
        this.topic = topic;
    }

    setDifficulty(difficulty: string) {
        this.difficulty = difficulty;
    }

    generateQuestion() {
        const [min, max] = difficultyRanges[this.difficulty] || [0, 10];
        const a = Math.floor(Math.random() * (max - min + 1)) + min;
        const b = Math.floor(Math.random() * (max - min + 1)) + min;

        const operations = topicOperations[this.topic] || ["+"];
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

        console.log(`New Question: (${this.topic}, ${this.difficulty}): ${this.currentQuestion}`);
        return this.currentQuestion;
    }

    submitAnswer(answer: number): boolean {
        if (answer === this.correctAnswer) {
            console.log("✅ Correct!");
            events.emit("AnsweredCorrectly", {
                question: this.currentQuestion,
                answer,
            });
            this.generateQuestion();
            return true;
        } else {
            console.log(
                `❌ Incorrect (expected ${this.correctAnswer}, got ${answer})`
            );
            events.emit("AnsweredIncorrectly", {
                question: this.currentQuestion,
                answer,
            });

            this.generateQuestion();
            return false;
        }
    }

    getCurrentQuestion() {
        return this.currentQuestion;
    }
}
