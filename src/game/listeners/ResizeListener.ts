export class ResizeListener {
    private ro?: ResizeObserver;
    constructor(
        private el: HTMLElement,
        private onResize: (w: number, h: number) => void,
    ) {}

    start() {
        const fit = () =>
            this.onResize(this.el.clientWidth, this.el.clientHeight);
        fit();
        this.ro = new ResizeObserver(fit);
        this.ro.observe(this.el);
    }

    stop() {
        this.ro?.disconnect();
    }
}
