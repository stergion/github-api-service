import { Response } from "express";
import { SSEError } from "./errors/SSEError.js";

const HEARTBEAT_INTERVAL_MS = process.env["HEARTBEAT_INTERVAL_MS"]
    ? parseInt(process.env["HEARTBEAT_INTERVAL_MS"])
    : 30_000;

export class SSEStream {
    private res: Response;
    private interval!: NodeJS.Timeout;

    constructor(res: Response);
    constructor(res: Response, intervalMs: number);
    constructor(res: Response, intervalMs?: number) {
        const heartbeatInterval = intervalMs ?? HEARTBEAT_INTERVAL_MS;

        this.res = res;
        if (!res.headersSent) {
            this.initializeHeaders();
        }
        
        this.interval = this.startHeartbeat(heartbeatInterval);
        res.on("close", () => {
            console.log("close event fired!!!");
            this.stopHeartbeat();
        });
    }

    private initializeHeaders(): void {
        this.res.setHeader("X-SSE-Content-Type", "application/json");
        this.res.setHeader("Content-Type", "text/event-stream");
        this.res.setHeader("Cache-Control", "no-cache");
        this.res.setHeader("Connection", "keep-open");
        this.res.status(200);

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
        this.stopHeartbeat();
    }

    private sendHeartbeat(): void {
        this.res.write("event: heartbeat\n\n");
    }

    private startHeartbeat(intervalMs: number = 30000) {
        this.sendHeartbeat();
        return setInterval(() => this.sendHeartbeat(), intervalMs);
    }

    public stopHeartbeat(): void {
        clearInterval(this.interval);
    }
}
