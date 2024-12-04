import { Response } from "express";
import { SSEError } from "./errors/SSEError.js";

export class SSEStream {
    private res: Response;

    constructor(res: Response) {
        this.res = res;
        if (!res.headersSent) {
            this.initializeHeaders();
        }
    }

    private initializeHeaders(): void {
        this.res.setHeader("Content-Type", "text/event-stream");
        this.res.setHeader("Cache-Control", "no-cache");
        this.res.setHeader("Connection", "keep-open");
        this.res.status(200)

        // Flush headers immediately
        if ("flushHeaders" in this.res) {
            this.res.flushHeaders();
        }
    }

    private writeEvent(data: any): void {
        this.res.write(`event: success\ndata: ${JSON.stringify(data)}\n\n`);
    }

    private writeError(data: Record<string, any>) {
        this.res.write(`event: error\ndata: ${JSON.stringify(data)}\n\n`);
    }

    public async streamResponse<U extends Record<string, any> | Record<string, any>[]>(
        queryRes: Promise<U> | U
    ) {
        const response = await queryRes;

        if (Array.isArray(response)) {
            for (const element of response) {
                this.writeEvent(element);
            }
        } else {
            this.writeEvent(response);
        }
    }

    public streamError(error: SSEError) {
        this.writeError(error.toData());
    }
}
