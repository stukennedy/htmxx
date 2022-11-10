export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'WS';
export type Partial = {
  id: string;
  html: string;
};
export type HtmxxFile = {
  path: string;
  route: string;
  routeRe: RegExp;
  name: string;
  hidden: boolean;
  depth: number;
  method: Method;
};

export type HtmxxRequest = {
  params: Record<string, string>;
  query: Record<string, string>;
  body: Record<string, string | number | undefined>;
  headers: Record<string, string>;
  redirect: (status: number, location: string) => void;
  broadcast: (markup: string) => void;
};

export class RedirectError {
  status: number;
  location: string;
  constructor(status: number, location: string) {
    this.status = status;
    this.location = location;
  }
}

export type Output = {
  ws?: boolean;
  markup?: string;
  redirect?: RedirectError;
};

export type HtmxxFunction = (
  req: HtmxxRequest,
  children: string
) => Promise<string>;
