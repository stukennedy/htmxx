import type { Request, Response, Express } from 'express';
var express = require('express');
import bodyParser from 'body-parser';
import compression from 'compression';
import dotenv from 'dotenv';
import { getFiles, closestErrorFile, processFile } from './router';
import type { Method, Route } from './router';
import { appendFile } from 'fs';

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

(() => {
  const app = express();
  const expressWs = require('express-ws')(app);
  const PORT = process.env.PORT || 3000;

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.set('view engine', 'html');

  app.use(express.static(__dirname + '/assets'));
  app.use(compression());

  const baseRoute = __dirname + '/routes';
  const routes: Route[] = getFiles(baseRoute, baseRoute);
  console.log({ routes });
  routes.map((f) => {
    if (!f.hidden) {
      getAppMethod(app, f.method, f.route, (req: Request, res: Response) => {
        let output = '';
        try {
          output = processFile(routes, f, true);
        } catch (error) {
          console.error(error);
          const errorRoute = closestErrorFile(routes, f.depth);
          if (errorRoute) {
            output = processFile(routes, errorRoute, false);
          } else {
            output = `<div>ERROR: ${error}</div<`;
          }
        } finally {
          res.send(output);
        }
      });
    }
  });
  app.listen(PORT, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
  });
})();
