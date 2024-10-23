import { deepFindPathToProperty, get } from "./deepFindPathToProperty.js";

export { getQueryNodes, MissingPageInfo };

class MissingPageInfo extends Error {
    [key: string]: any;
    constructor(response: any) {
        super(
            `No pageInfo property found in response. Please make sure to specify the pageInfo in your query. Response-Data: ${JSON.stringify(
                response,
                null,
                2
            )}`
        );
        this.response = response;
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
        throw new MissingPageInfo(data);
    }
    return get(data, [...paginatedResourcePath, "nodes"]) as unknown as any[];
}
