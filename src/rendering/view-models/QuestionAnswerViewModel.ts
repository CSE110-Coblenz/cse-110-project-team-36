/**
 * View model for QuestionAnswer component
 * Contains all data and callbacks needed to render the question answer UI
 */
export interface QuestionAnswerViewModel {
    answer: string;
    feedback: 'none' | 'correct' | 'incorrect';
    currentQuestion: string;
    onAddChar: (char: string) => void;
    onDeleteChar: () => void;
    onSubmit: () => void;
    onSkip: () => void;
}

