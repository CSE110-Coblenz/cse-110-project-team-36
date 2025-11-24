import { QuestionTopic, QuestionDifficulty } from '../game/models/question';

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
export function difficultyStringToEnum(difficulty: string): QuestionDifficulty {
    return difficulty.toLowerCase() as QuestionDifficulty;
}
