export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'WS';
export type Partial = {
  id: string;
  html: string;
};
export type HtmxxFile = {
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

export type HtmxxRequest = {
  params: Record<string, string>;
  query: Record<string, string>;
  body: Record<string, string | number | undefined>;
};

export class RedirectError {
  status: number;
  location: string;
  constructor(status: number, location: string) {
    this.status = status;
    this.location = location;
  }
}
