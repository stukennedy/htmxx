export declare type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'WS';
export declare type Partial = {
    id: string;
    html: string;
};
export declare type HtmxxFile = {
    path: string;
    route: string;
    name: string;
    hidden: boolean;
    depth: number;
    method: Method;
    script: string;
    partials: Partial[];
    ws?: string;
};
export declare type HtmxxRequest = {
    params: Record<string, string>;
    query: Record<string, string>;
    body: Record<string, string | number | undefined>;
};
export declare class RedirectError {
    status: number;
    location: string;
    constructor(status: number, location: string);
}
