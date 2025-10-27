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
