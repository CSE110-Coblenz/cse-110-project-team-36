import type { WindowService } from '../../services/adapters/WindowService';

export class EscapeListener {
    private onKey = (e: Event) => {
        if (e instanceof KeyboardEvent && e.key === 'Escape') {
            e.preventDefault();
            this.onExit();
        }
    };
    constructor(
        private onExit: () => void,
        private windowService: WindowService,
    ) {}
    start() {
        this.windowService.addEventListener('keydown', this.onKey);
    }
    stop() {
        this.windowService.removeEventListener('keydown', this.onKey);
    }
}

export class SpaceRewardListener {
    private onKey = (e: Event) => {
        if (e instanceof KeyboardEvent && (e.key === ' ' || e.key === 'Spacebar')) {
            e.preventDefault();
            this.onReward();
        }
    };
    constructor(
        private onReward: () => void,
        private windowService: WindowService,
    ) {}
    start() {
        this.windowService.addEventListener('keydown', this.onKey);
    }
    stop() {
        this.windowService.removeEventListener('keydown', this.onKey);
    }
}

export class NumberInputListener {
    private onKey = (e: Event) => {
        if (e instanceof KeyboardEvent && (/^[0-9]$/.test(e.key) || e.key === '.' || e.key === '-')) {
            this.onInput(e.key);
        }
    };
    constructor(
        private onInput: (char: string) => void,
        private windowService: WindowService,
    ) {}
    start() {
        this.windowService.addEventListener('keydown', this.onKey);
    }
    stop() {
        this.windowService.removeEventListener('keydown', this.onKey);
    }
}

export class DeleteListener {
    private onKey = (e: Event) => {
        if (e instanceof KeyboardEvent && (e.key === 'Backspace' || e.key === 'Delete')) {
            e.preventDefault();
            this.onDelete();
        }
    };
    constructor(
        private onDelete: () => void,
        private windowService: WindowService,
    ) {}
    start() {
        this.windowService.addEventListener('keydown', this.onKey);
    }
    stop() {
        this.windowService.removeEventListener('keydown', this.onKey);
    }
}

export class EnterSubmitListener {
    private onKey = (e: Event) => {
        if (e instanceof KeyboardEvent && e.key === 'Enter') {
            e.preventDefault();
            this.onSubmit();
        }
    };
    constructor(
        private onSubmit: () => void,
        private windowService: WindowService,
    ) {}
    start() {
        this.windowService.addEventListener('keydown', this.onKey);
    }
    stop() {
        this.windowService.removeEventListener('keydown', this.onKey);
    }
}

export class SkipQuestionListener {
    private onKey = (e: Event) => {
        if (e instanceof KeyboardEvent && (e.key === 's' || e.key === 'S')) {
            e.preventDefault();
            this.onSkip();
        }
    };
    constructor(
        private onSkip: () => void,
        private windowService: WindowService,
    ) {}
    start() {
        this.windowService.addEventListener('keydown', this.onKey);
    }
    stop() {
        this.windowService.removeEventListener('keydown', this.onKey);
    }
}

export class LaneChangeListener {
    private onKey = (e: Event) => {
        if (e instanceof KeyboardEvent) {
            const key = e.key.toLowerCase();
            if (key === 'a' || key === 'arrowleft') {
                e.preventDefault();
                this.onLaneChange(1);
            } else if (key === 'd' || key === 'arrowright') {
                e.preventDefault();
                this.onLaneChange(-1);
            }
        }
    };
    constructor(
        private onLaneChange: (direction: -1 | 1) => void,
        private windowService: WindowService,
    ) {}
    start() {
        this.windowService.addEventListener('keydown', this.onKey);
    }
    stop() {
        this.windowService.removeEventListener('keydown', this.onKey);
    }
}
