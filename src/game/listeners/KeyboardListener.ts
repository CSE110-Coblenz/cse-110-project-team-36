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
