import express, { Request, RequestHandler, Response } from 'express';
import expressWs, { Application } from 'express-ws';
import bodyParser from 'body-parser';
import type { Htmxx } from './';
import { HtmxxRequest, RedirectError } from './interfaces';
import type { Method } from './interfaces';

export default function (htmxx: Htmxx, port?: number) {
  const PORT = Number(port || 3000);

  const app = express() as unknown as Application;
  const appWs = expressWs(app);

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.set('view engine', 'html');
  app.use(express.static(htmxx.dir + '/assets'));

  const getAppMethod = (
    method: Method,
    route: string,
    callback: RequestHandler
  ) => {
    const paramRoute = route.replace(/\[(.+?)\]/g, ':$1');
    switch (method) {
      case 'DELETE':
        return app.delete(paramRoute, callback);
      case 'PUT':
        return app.put(paramRoute, callback);
      case 'POST':
        return app.post(paramRoute, callback);
      case 'PATCH':
        return app.patch(paramRoute, callback);
      default:
        return app.get(paramRoute, callback);
    }
  };

  const broadcast = (markup: string) =>
    appWs
      .getWss()
      .clients.forEach((client) => client.OPEN && client.send(markup));

  htmxx.files.forEach((f) => {
    if (f.hidden) return;
    const request: HtmxxRequest = {
      body: {},
      params: {},
      query: {},
      headers: {},
      redirect: (status: number, location: string) => {
        throw new RedirectError(status, location);
      },
      broadcast,
    };
    if (f.method === 'WS') {
      const paramRoute = f.route.replace(/\[(.+?)\]/g, ':$1');
      app.ws(paramRoute, (req) => {
        req.on('message', async (msg) => {
          request.body = JSON.parse(String(msg) || '{}');
          const markup = await htmxx.processRoute(f.route, f.method, request);
          broadcast(markup);
        });
      });
    } else {
      getAppMethod(f.method, f.route, async (req: Request, res: Response) => {
        try {
          request.body = req.body;
          request.params = req.params;
          request.query = req.query as Record<string, string>;
          request.headers = req.headers as Record<string, string>;
          const markup = await htmxx.processRoute(
            req.originalUrl.replace(/\?.+$/, ''),
            f.method,
            request
          );
          res.send(markup);
        } catch (error) {
          // eslint-disable-next-line no-prototype-builtins
          if (error?.hasOwnProperty('location')) {
            const redirect = error as RedirectError;
            res.redirect(redirect.status, redirect.location);
            return;
          }
        }
      });
    }
  });

  app.listen(PORT, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
  });
}
