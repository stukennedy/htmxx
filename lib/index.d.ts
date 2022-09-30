import { HtmxxFile } from './interfaces';
import type { Method, HtmxxRequest, Output } from './interfaces';
export declare class Htmxx {
    files: HtmxxFile[];
    constructor(dir: string);
    getRoutes(): string[];
    private getErrorFile;
    private parseFiles;
    private processPath;
    processRoute(route: string, method: Method, req: HtmxxRequest): Promise<Output>;
    startServer(): void;
}
