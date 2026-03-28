const DEFAULT_DEBOUNCE_MS = 300;

export function debounce(fn, delay = DEFAULT_DEBOUNCE_MS) {
    let timer;
    const debounced = (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
    debounced.cancel = () => {
        clearTimeout(timer);
    };
    debounced.flush = (...args) => {
        clearTimeout(timer);
        fn(...args);
    };
    return debounced;
}
