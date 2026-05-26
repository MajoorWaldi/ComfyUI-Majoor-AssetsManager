const DEFAULT_DEBOUNCE_MS = 300;

export interface DebouncedFn<TArgs extends unknown[]> {
    (...args: TArgs): void;
    cancel(): void;
    flush(...args: TArgs): void;
}

export function debounce<TArgs extends unknown[]>(
    fn: (...args: TArgs) => void,
    delay = DEFAULT_DEBOUNCE_MS,
): DebouncedFn<TArgs> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const debounced = (...args: TArgs) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
    debounced.cancel = () => {
        clearTimeout(timer);
    };
    debounced.flush = (...args: TArgs) => {
        clearTimeout(timer);
        fn(...args);
    };
    return debounced as DebouncedFn<TArgs>;
}
