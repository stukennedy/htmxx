import type { Request, Response } from 'express';
var express = require('express');
import bodyParser from 'body-parser';
import compression from 'compression';
import dotenv from 'dotenv';
import { getFiles, closestErrorFile, processFile, Route } from './router';

dotenv.config();

const app = express();
const expressWs = require('express-ws')(app);
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'html');

app.use(express.static(__dirname + '/assets'));
app.use(compression());

(async () => {
  const baseRoute = __dirname + '/routes';
  const routes: Route[] = await getFiles(baseRoute, baseRoute);
  routes.map((f) => {
    if (!f.hidden) {
      app.get(f.route, async (req: Request, res: Response) => {
        let output = '';
        try {
          output = await processFile(routes, f, true);
        } catch (error) {
          console.error(error);
          const errorRoute = closestErrorFile(routes, f.depth);
          if (errorRoute) {
            output = await processFile(routes, errorRoute, false);
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
