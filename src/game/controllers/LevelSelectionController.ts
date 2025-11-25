// controllers/LevelSelectionController.ts
import { LevelModel } from '../models/LevelModel';
import { QuestionDifficulty, QuestionTopic } from '../models/question';

export class LevelSelectionController {
    index = 0;

    nextLevel() {
        this.index = (this.index + 1) % LevelModel.count();
        return this.index;
    }

    prevLevel() {
        this.index = (this.index - 1 + LevelModel.count()) % LevelModel.count();
        return this.index;
    }

    getCurrentLevel() {
        return LevelModel.getLevel(this.index);
    }

    getDifficultyColor(difficulty: QuestionDifficulty) {
        switch (difficulty) {
            case QuestionDifficulty.EASY:
                return '#4CAF50';
            case QuestionDifficulty.MEDIUM:
                return '#FF9800';
            case QuestionDifficulty.HARD:
                return '#F44336';
            default:
                return '#666';
        }
    }

    getDifficultyText(difficulty: QuestionDifficulty) {
        switch (difficulty) {
            case QuestionDifficulty.EASY:
                return 'EASY';
            case QuestionDifficulty.MEDIUM:
                return 'MEDIUM';
            case QuestionDifficulty.HARD:
                return 'HARD';
            default:
                return 'UNKNOWN';
        }
    }

    getTopicSymbol(topic: QuestionTopic) {
        switch (topic) {
            case QuestionTopic.ADDITION:
                return '+';
            case QuestionTopic.SUBTRACTION:
                return '−';
            case QuestionTopic.MULTIPLICATION:
                return '×';
            case QuestionTopic.DIVISION:
                return '÷';
            case QuestionTopic.MIXED:
                return '±×÷';
            default:
                return '?';
        }
    }

    getTopicName(topic: QuestionTopic) {
        switch (topic) {
            case QuestionTopic.ADDITION:
                return 'Addition';
            case QuestionTopic.SUBTRACTION:
                return 'Subtraction';
            case QuestionTopic.MULTIPLICATION:
                return 'Multiplication';
            case QuestionTopic.DIVISION:
                return 'Division';
            case QuestionTopic.MIXED:
                return 'Mixed Operations';
            default:
                return 'Unknown';
        }
    }

    getTotalLevels() {
        return LevelModel.count();
    }
}
