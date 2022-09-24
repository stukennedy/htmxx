import type { Request, Response } from 'express';
import express from 'express';
import expressWs, { Application, Instance } from 'express-ws';
import bodyParser from 'body-parser';
import compression from 'compression';
import dotenv from 'dotenv';
import { getFiles, closestErrorFile, processPath } from './router';
import type { Method, Route } from './router';

dotenv.config();
const PORT = Number(process.env.PORT || 3000);

const app = express() as unknown as Application;
const appWs = expressWs(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'html');
app.use(express.static(process.cwd() + '/assets'));
app.use(compression());

type Redirect = {
  location: string;
  status: number;
};

const getAppMethod = (
  method: Method,
  route: string,
  callback: (req: Request, res: Response) => void
) => {
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
    default:
      return app.get(paramRoute, callback);
  }
};

const htmxx = async (routesDir: string) => {
  const baseRoute = process.cwd() + routesDir;
  const routes: Route[] = getFiles(baseRoute, baseRoute);
  if (!routes || !routes.length) {
    throw new Error(`no valid routes found for path: ${baseRoute}`);
  }
  routes.forEach((f) => {
    if (f.hidden) return;
    if (f.method === 'WS') {
      app.ws(f.route, (ws, req) => {
        ws.on('message', async (msg: string) => {
          req.body = JSON.parse(msg || '{}');
          const { markup } = await processPath(req, routes, f, false);
          appWs.getWss().clients.forEach((client) => {
            if (client.OPEN) {
              client.send(markup);
            }
          });
        });
      });
      return;
    }
    getAppMethod(f.method, f.route, async (req: Request, res: Response) => {
      try {
        const { ws, markup } = await processPath(
          req,
          routes,
          f,
          f.method === 'GET'
        );
        if (ws !== undefined) {
          appWs.getWss().clients.forEach((client) => {
            if (client.OPEN) {
              client.send(markup);
            }
          });
        }
        res.send(markup);
      } catch (error: unknown) {
        if (error?.hasOwnProperty('location')) {
          const { location, status } = error as Redirect;
          res.redirect(status, location);
          return;
        }
        const errorRoute = closestErrorFile(routes, f.depth);
        if (errorRoute) {
          const { markup } = await processPath(req, routes, errorRoute, false);
          res.send(markup);
        } else {
          res.send(`<div>${error}</div>`);
        }
      }
    });
  });
  return new Promise((resolve) => {
    app.listen(PORT, () => {
      console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
      resolve(app);
    });
  });
};
module.exports = htmxx;
