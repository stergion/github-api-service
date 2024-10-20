export { getDirLogger };

function getDirLogger(depth: Number | null = null) {
    return async <TData extends { [key: string]: any }>(item: TData) => {
        console.dir(await item, { depth: null, colors: true });
        return item;
    };
}
