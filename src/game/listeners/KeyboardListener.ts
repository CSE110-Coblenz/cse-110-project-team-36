export class EscapeListener {
    private onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
            e.preventDefault();
            this.onExit();
        }
    };
    constructor(private onExit: () => void) { }
    start() { window.addEventListener("keydown", this.onKey); }
    stop() { window.removeEventListener("keydown", this.onKey); }
}

export class SpaceRewardListener {
    private onKey = (e: KeyboardEvent) => {
        if (e.key === " " || e.key === "Spacebar") {
            e.preventDefault();
            this.onReward();
        }
    };
    constructor(private onReward: () => void) { }
    start() { window.addEventListener("keydown", this.onKey); }
    stop() { window.removeEventListener("keydown", this.onKey); }
}

export class NumberInputListener {
    private onKey = (e: KeyboardEvent) => {
        if (/^[0-9]$/.test(e.key) || e.key === "." || e.key === "-") {
            this.onInput(e.key);
        }
    };
    constructor(private onInput: (char: string) => void) { }
    start() { window.addEventListener("keydown", this.onKey); }
    stop() { window.removeEventListener("keydown", this.onKey); }
}

export class DeleteListener {
    private onKey = (e: KeyboardEvent) => {
        if (e.key === "Backspace" || e.key === "Delete") {
            e.preventDefault();
            this.onDelete();
        }
    };
    constructor(private onDelete: () => void) { }
    start() { window.addEventListener("keydown", this.onKey); }
    stop() { window.removeEventListener("keydown", this.onKey); }
}

export class EnterSubmitListener {
    private onKey = (e: KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            this.onSubmit();
        }
    };
    constructor(private onSubmit: () => void) { }
    start() { window.addEventListener("keydown", this.onKey); }
    stop() { window.removeEventListener("keydown", this.onKey); }
}

export class SkipQuestionListener {
    private onKey = (e: KeyboardEvent) => {
        if (e.key === "s" || e.key === "S") {
            e.preventDefault();
            this.onSkip();
        }
    };
    constructor(private onSkip: () => void) { }
    start() { window.addEventListener("keydown", this.onKey); }
    stop() { window.removeEventListener("keydown", this.onKey); }
}

export class LaneChangeListener {
    private onKey = (e: KeyboardEvent) => {
        const key = e.key.toLowerCase();
        if (key === "a" || key === "arrowleft") {
            e.preventDefault();
            this.onLaneChange(1);
        } else if (key === "d" || key === "arrowright") {
            e.preventDefault();
            this.onLaneChange(-1);
        }
    };
    constructor(private onLaneChange: (direction: -1 | 1) => void) { }
    start() { window.addEventListener("keydown", this.onKey); }
    stop() { window.removeEventListener("keydown", this.onKey); }
}
