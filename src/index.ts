import type { Request, Response, Express } from 'express';
import express from 'express';
import ExpressWS from 'express-ws';
import bodyParser from 'body-parser';
import compression from 'compression';
import dotenv from 'dotenv';
import { getFiles, closestErrorFile, processPath } from './router';
import type { Method, Route } from './router';

dotenv.config();

const getAppMethod = (
  app: Express,
  method: Method,
  route: string,
  callback: (req: Request, res: Response) => void
) => {
  switch (method) {
    case 'DELETE':
      return app.delete(route, callback);
    case 'UPDATE':
      return app.set(route, callback);
    case 'PUT':
      return app.put(route, callback);
    case 'POST':
      return app.post(route, callback);
    default:
      return app.get(route, callback);
  }
};

const htmxx = async (routesDir?: string) => {
  const app = express();
  const expressWs = ExpressWS(app);
  const PORT = process.env.PORT || 3000;

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.set('view engine', 'html');
  app.use(express.static(process.cwd() + '/assets'));
  app.use(compression());

  const baseRoute = process.cwd() + (routesDir || '/routes');
  const routes: Route[] = getFiles(baseRoute, baseRoute);
  if (!routes || !routes.length) {
    throw new Error(`no valid routes found for path: ${baseRoute}`);
  }
  routes.map((f) => {
    if (!f.hidden) {
      getAppMethod(
        app,
        f.method,
        f.route,
        async (req: Request, res: Response) => {
          let output = '';
          try {
            output = await processPath(req, res, routes, f, f.method === 'GET');
          } catch (error) {
            console.error(error);
            const errorRoute = closestErrorFile(routes, f.depth);
            if (errorRoute) {
              output = await processPath(req, res, routes, errorRoute, false);
            } else {
              output = `<div>ERROR: ${error}</div<`;
            }
          } finally {
            res.send(output);
          }
        }
      );
    }
  });
  return new Promise((resolve) => {
    app.listen(PORT, () => {
      console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
      resolve(app);
    });
  });
};
module.exports = htmxx;
