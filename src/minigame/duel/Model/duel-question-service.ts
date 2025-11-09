// MODEL-SIDE helper: defines question shape + generation logic (no UI).

export interface DuelQuestion {
  id: number;
  text: string;
  correctAnswer: number;
  options: number[];
}

let nextId = 1;

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

/**
 * Generate a small arithmetic puzzle.
 * difficultyLevel: 1..3 (we'll ramp this based on player streak).
 */
export function generateQuestion(difficultyLevel: number): DuelQuestion {
  const id = nextId++;

  const max = 5 + (difficultyLevel * 5);
  const a = Math.floor(Math.random() * max) + 1;
  const b = Math.floor(Math.random() * max) + 1;

  const ops = ["+", "-", "*"] as const;
  const op = ops[Math.floor(Math.random() * ops.length)];

  let correct: number;
  let text: string;

  switch (op) {
    case "+":
      correct = a + b;
      text = `${a} + ${b}`;
      break;
    case "-":
      correct = a - b;
      text = `${a} − ${b}`;
      break;
    case "*":
      correct = a * b;
      text = `${a} × ${b}`;
      break;
  }

  const options = new Set<number>();
  options.add(correct);

  while (options.size < 4) {
    const noise = Math.floor((Math.random() - 0.5) * 8);
    let candidate = correct + noise;
    if (candidate === correct) candidate = correct + 1;
    options.add(candidate);
  }

  return {
    id,
    text,
    correctAnswer: correct,
    options: shuffle(Array.from(options)),
  };
}
