// models/LevelModel.ts
import { QuestionDifficulty, QuestionTopic } from '../models/question';

export interface Level {
    id: string;
    name: string;
    description: string;
    difficulty: QuestionDifficulty;
    topic: QuestionTopic;
    unlocked: boolean;
    completed: boolean;
    track: string;
}

const levels: Level[] = [
    {
        id: 'level_1',
        name: 'Beginner Oval',
        description: 'Learn addition basics on a simple oval track',
        difficulty: QuestionDifficulty.EASY,
        topic: QuestionTopic.ADDITION,
        unlocked: true,
        completed: false,
        track: 'campaigntrack1',
    },
    {
        id: 'level_2',
        name: 'Speedway Addition',
        description: 'Practice addition on a faster speedway',
        difficulty: QuestionDifficulty.EASY,
        topic: QuestionTopic.ADDITION,
        unlocked: true,
        completed: false,
        track: 'campaigntrack2',
    },
    {
        id: 'level_3',
        name: 'Twisty Subtraction',
        description: 'Master subtraction on winding roads',
        difficulty: QuestionDifficulty.EASY,
        topic: QuestionTopic.SUBTRACTION,
        unlocked: true,
        completed: false,
        track: 'campaigntrack3',
    },
    {
        id: 'level_4',
        name: 'Mountain Subtraction',
        description: 'Advanced subtraction on mountainous terrain',
        difficulty: QuestionDifficulty.MEDIUM,
        topic: QuestionTopic.SUBTRACTION,
        unlocked: true,
        completed: false,
        track: 'campaigntrack4',
    },
    {
        id: 'level_5',
        name: 'City Mix Challenge',
        description: 'Mixed operations in urban environment',
        difficulty: QuestionDifficulty.MEDIUM,
        topic: QuestionTopic.MIXED,
        unlocked: true,
        completed: false,
        track: 'campaigntrack5',
    },
    {
        id: 'level_6',
        name: 'Desert Multiplication',
        description: 'Learn multiplication in the desert',
        difficulty: QuestionDifficulty.MEDIUM,
        topic: QuestionTopic.MULTIPLICATION,
        unlocked: true,
        completed: false,
        track: 'campaigntrack6',
    },
    {
        id: 'level_7',
        name: 'Forest Multiplication',
        description: 'Advanced multiplication in dense forest',
        difficulty: QuestionDifficulty.HARD,
        topic: QuestionTopic.MULTIPLICATION,
        unlocked: true,
        completed: false,
        track: 'campaigntrack7',
    },
    {
        id: 'level_8',
        name: 'Beach Division',
        description: 'Division practice by the beach',
        difficulty: QuestionDifficulty.HARD,
        topic: QuestionTopic.DIVISION,
        unlocked: true,
        completed: false,
        track: 'campaigntrack8',
    },
    {
        id: 'level_9',
        name: 'Alpine Mixed',
        description: 'All operations in alpine conditions',
        difficulty: QuestionDifficulty.HARD,
        topic: QuestionTopic.MIXED,
        unlocked: true,
        completed: false,
        track: 'campaigntrack9',
    },
    {
        id: 'level_10',
        name: 'Championship Final',
        description: 'Ultimate challenge on the championship track',
        difficulty: QuestionDifficulty.HARD,
        topic: QuestionTopic.MIXED,
        unlocked: true,
        completed: false,
        track: 'campaigntrack10',
    },
];

export const LevelModel = {
    getLevel: (index: number) => levels[index],
    count: () => levels.length,
};
