import type { HtmxxFile, Method, HtmxxRequest } from './interfaces';
declare class RedirectError {
    status: number;
    location: string;
    constructor(status: number, location: string);
}
export declare function parseFiles(baseRoute: string, currentDir?: string): any[];
declare type Output = {
    ws?: boolean;
    markup?: string;
    redirect?: RedirectError;
};
export declare function callEndpoint(route: string, method: Method, req: HtmxxRequest, files: HtmxxFile[]): Promise<Output | undefined>;
export {};
