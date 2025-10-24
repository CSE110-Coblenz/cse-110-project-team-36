export type Handler<T> = (payload: T) => void;

export class EventBus<M extends Record<string, unknown>> {
    private handlers: Partial<{ [K in keyof M]: Set<Handler<M[K]>> }>;

    constructor() {
        this.handlers = {};
    }

    private getSet<K extends keyof M>(type: K): Set<Handler<M[K]>> {
        const map = this.handlers as any;
        let set = map[type] as Set<Handler<M[K]>> | undefined;
        if (!set) {
            set = new Set<Handler<M[K]>>();
            map[type] = set;
        }
        return set;
    }

    on<K extends keyof M>(type: K, fn: Handler<M[K]>): () => void {
        this.getSet(type).add(fn);
        return () => this.off(type, fn);
    }

    off<K extends keyof M>(type: K, fn: Handler<M[K]>): void {
        const set = (this.handlers as any)[type] as Set<Handler<M[K]>> | undefined;
        if (set) set.delete(fn);
    }

    emit<K extends keyof M>(type: K, payload: M[K]): void {
        const set = (this.handlers as any)[type] as Set<Handler<M[K]>> | undefined;
        if (!set) return;
        const arr = Array.from(set);
        for (let i = 0; i < arr.length; i++) arr[i](payload);
    }
}

export type EventMap = {
    ExitRequested: {};
    ViewportResized: { width: number; height: number };
};

export const events = new EventBus<EventMap>();
