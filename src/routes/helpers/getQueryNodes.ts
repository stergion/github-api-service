import { FindNestedType } from "../../utils/UtilityTypes.js";
import { deepFindPathToProperty, get } from "./deepFindPathToProperty.js";

export { getQueryNodes, MissingNodes as MissingPageInfo };

class MissingNodes extends Error {
    [key: string]: any;
    constructor(response: any) {
        super(
            `No nodes property found in response. Response-Data: ${JSON.stringify(
                response,
                null,
                2
            )}`
        );
        this["response"] = response;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
    name = "MissingPageInfo";
}

async function getQueryNodes<TData extends {[key:string]:any}>(responseData: TData): Promise<Awaited<any[]>> {
    const data = await responseData;
    const paginatedResourcePath = deepFindPathToProperty(data, "nodes");
    if (paginatedResourcePath.length === 0) {
        throw new MissingNodes(data);
    }
    return get(data, [...paginatedResourcePath, "nodes"]) as unknown as any[];
}
