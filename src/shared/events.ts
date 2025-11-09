import type { DuelResultTier } from "../minigame/duel/Model/duel-model";

export type Handler<T> = (payload: T) => void;

export class EventBus<M extends Record<string, unknown>> {
    private handlers = new Map<keyof M, Set<Handler<unknown>>>();

    on<K extends keyof M>(type: K, fn: Handler<M[K]>): () => void {
        let set = this.handlers.get(type);
        if (!set) {
            set = new Set();
            this.handlers.set(type, set);
        }
        set.add(fn as Handler<unknown>);
        return () => this.off(type, fn);
    }

    off<K extends keyof M>(type: K, fn: Handler<M[K]>): void {
        const set = this.handlers.get(type);
        if (set) {
            set.delete(fn as Handler<unknown>);
        }
    }

    emit<K extends keyof M>(type: K, payload: M[K]): void {
        const set = this.handlers.get(type);
        if (!set) return;

        for (const handler of set) {
            (handler as Handler<M[K]>)(payload);
        }
    }
}

export type EventMap = {
    ExitRequested: Record<string, never>;
    ViewportResized: { width: number; height: number };
    AnsweredCorrectly: { question: string; answer: number };
    AnsweredIncorrectly: { question: string; answer: number };
    QuestionSkipped: { question: string };
    QuestionCompleted: { question: unknown };
    TogglePause: Record<string, never>;
    PausedSet: { value: boolean };
    SettingsRequested: Record<string, never>;
    QuestionStateChanged: Record<string, never>;
    PitMinigameRequested: Record<string, never>;        //Event emitted by UI
    PitMinigameCompleted: {tier: DuelResultTier};       //Event emitted by UI
    
};

export const events = new EventBus<EventMap>();