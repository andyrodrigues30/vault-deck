export class DecksEventBus {
    private static listeners: Record<string, Array<() => void>> = {};

    static on(event: string, callback: () => void) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }

    static emit(event: string) {
        this.listeners[event]?.forEach(cb => cb());
    }
}
