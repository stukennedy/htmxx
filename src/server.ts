import express, { Request, Response } from 'express';
import expressWs, { Application } from 'express-ws';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import type { Htmxx } from './';
import { Method } from './interfaces';

export default function (htmxx: Htmxx) {
  dotenv.config();
  const PORT = Number(process.env.PORT || 3000);

  const app = express() as unknown as Application;
  const appWs = expressWs(app);

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.set('view engine', 'html');
  app.use(express.static(process.cwd() + '/assets'));

  const getAppMethod = (method: Method, route: string, callback: any) => {
    const paramRoute = route.replace(/\[(.+)\]/g, ':$1');
    switch (method) {
      case 'DELETE':
        return app.delete(paramRoute, callback);
      case 'PUT':
        return app.put(paramRoute, callback);
      case 'POST':
        return app.post(paramRoute, callback);
      case 'PATCH':
        return app.patch(paramRoute, callback);
      case 'WS':
        return app.ws(paramRoute, callback);
      default:
        return app.get(paramRoute, callback);
    }
  };

  htmxx.files.forEach((f) => {
    if (f.hidden) return;
    getAppMethod(f.method, f.route, async (req: Request, res: Response) => {
      if (f.method === 'WS') {
        req.on('message', async (msg) => {
          const request = {
            body: JSON.parse(msg || '{}'),
            params: {},
            query: {},
            headers: {},
          };
          const { markup } = await htmxx.processRoute(
            f.route,
            f.method,
            request
          );
          appWs.getWss().clients.forEach((client) => {
            if (client.OPEN) {
              client.send(markup);
            }
          });
        });
      } else {
        const { ws, markup, redirect } = await htmxx.processRoute(
          req.originalUrl.replace(/\?.+$/, ''),
          f.method,
          req
        );
        if (ws !== undefined) {
          appWs.getWss().clients.forEach((client) => {
            if (client.OPEN) {
              client.send(markup);
            }
          });
        }
        if (redirect) {
          res.redirect(redirect.status, redirect.location);
          return;
        }
        res.send(markup);
      }
    });
  });

  app.listen(PORT, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
  });
}
