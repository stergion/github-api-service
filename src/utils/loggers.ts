import { InspectOptions } from "node:util";

const defaultOptions: InspectOptions = {
    depth: null,
};

export function getDirLogger(options?: InspectOptions) {
    options = { ...defaultOptions, ...options };
    return async <TData extends { [key: string]: any }>(item: TData) => {
        console.dir(await item, options);
        return item;
    };
}
