export { deepFindPathToProperty, get, set };

var isObject = (value: any) => Object.prototype.toString.call(value) === "[object Object]";

function deepFindPathToProperty(object: any, searchProp: string, path: string[] = []): string[] {
    for (const key of Object.keys(object)) {
        const currentPath = [...path, key];
        const currentValue = object[key];
        if (isObject(currentValue)) {
            if (currentValue.hasOwnProperty(searchProp)) {
                return currentPath;
            }
            const result = deepFindPathToProperty(currentValue, searchProp, currentPath);
            if (result.length > 0) {
                return result;
            }
        }
    }
    return [];
}
function get<TData extends {[key: string]: any}>(object: TData, path: string[]) {
    return path.reduce((current, nextProperty) => current[nextProperty], object);
}

type Mutator = any | ((value: unknown) => any);
// @ts-ignore
var set = (object: any, path: string[], mutator: Mutator) => {
    const lastProperty = path[path.length - 1];
    const parentPath = [...path].slice(0, -1);
    const parent = get(object, parentPath);
    if (typeof mutator === "function") {
        // @ts-ignore
        parent[lastProperty] = mutator(parent[lastProperty]);
    } else {
        // @ts-ignore
        parent[lastProperty] = mutator;
    }
};
