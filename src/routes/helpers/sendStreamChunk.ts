import { Response } from "express";

export function streamResponse(res: Response) {
    return async <U>(queryRes: U): Promise<Awaited<U>> => {
        const response = await queryRes;
        if (Array.isArray(response)) {
            for (let i = 0; i < response.length; i++) {
                const element = response[i];
                res.write(JSON.stringify(element));
            }
        } else {
            res.write(JSON.stringify(response));
        }
        return response
    };
}
