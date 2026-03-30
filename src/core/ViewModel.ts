export abstract class ViewModel {
    private readonly _disposeCallbacks: Array<() => void> = [];

    protected addDisposable(cleanup: () => void): void {
        this._disposeCallbacks.push(cleanup);
    }

    dispose(): void {
        while (this._disposeCallbacks.length) {
            this._disposeCallbacks.pop()!();
        }
    }
}
