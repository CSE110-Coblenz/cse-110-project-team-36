import { QuestionTopic } from '../game/models/question';
import { Difficulty } from '../game/config/types';

/**
 * Question-related utility functions
 */

/**
 * Convert a topic string to QuestionTopic enum
 *
 * @param topic - The topic string
 * @returns The QuestionTopic enum value
 */
export function topicStringToEnum(topic: string): QuestionTopic {
    return topic.toLowerCase() as QuestionTopic;
}

/**
 * Convert a difficulty string to QuestionDifficulty enum
 *
 * @param difficulty - The difficulty string
 * @returns The QuestionDifficulty enum value
 */
export function difficultyStringToEnum(difficulty: string): Difficulty {
    return difficulty.toLowerCase() as Difficulty;
}
