import { HtmxxFile } from './interfaces';
import type { Method, HtmxxRequest } from './interfaces';
export declare class Htmxx {
    files: HtmxxFile[];
    dir: string;
    constructor(dir: string);
    getRoutes(): string[];
    private getErrorFile;
    private parseFiles;
    private processPath;
    processRoute(route: string, method: Method, req: HtmxxRequest): Promise<string>;
    startServer(): void;
}
