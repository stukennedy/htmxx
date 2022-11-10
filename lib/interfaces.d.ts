export declare type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'WS';
export declare type Partial = {
    id: string;
    html: string;
};
export declare type HtmxxFile = {
    path: string;
    route: string;
    routeRe: RegExp;
    name: string;
    hidden: boolean;
    depth: number;
    method: Method;
};
export declare type HtmxxRequest = {
    params: Record<string, string>;
    query: Record<string, string>;
    body: Record<string, string | number | undefined>;
    headers: Record<string, string>;
    redirect: (status: number, location: string) => void;
    broadcast: (markup: string) => void;
};
export declare class RedirectError {
    status: number;
    location: string;
    constructor(status: number, location: string);
}
export declare type Output = {
    ws?: boolean;
    markup?: string;
    redirect?: RedirectError;
};
export declare type HtmxxFunction = (req: HtmxxRequest, children: string) => Promise<string>;
