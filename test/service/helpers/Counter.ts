export class Counter {
    value: number;
    constructor(initialValue?: number) {
        this.value = initialValue ?? 0;
    }

    increment() {
        this.value++;
    }

    decrement() {
        this.value--;
    }

    get() {
        const v = this.value;
        this.increment();
        return v.toString();
    }
}
