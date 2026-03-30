export class Observable<T> {
    private _value: T;
    private readonly _subscribers = new Set<(value: T) => void>();

    constructor(initialValue: T) {
        this._value = initialValue;
    }

    get(): T {
        return this._value;
    }

    set(next: T): void {
        if (Object.is(this._value, next)) return;
        this._value = next;
        this._notify(next);
    }

    mutate(updater: (value: T) => void): void {
        updater(this._value);
        this._notify(this._value);
    }

    subscribe(subscriber: (value: T) => void): () => void {
        this._subscribers.add(subscriber);
        subscriber(this._value);
        return () => this._subscribers.delete(subscriber);
    }

    private _notify(value: T): void {
        for (const sub of this._subscribers) {
            sub(value);
        }
    }
}
