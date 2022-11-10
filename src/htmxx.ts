import { resolve } from 'path';
import { readdirSync } from 'fs';
import { HtmxxFile, RedirectError } from './interfaces';
import type { Method, HtmxxRequest, HtmxxFunction } from './interfaces';
import * as utils from './utils';
import server from './server';

const LAYOUT = '_layout.ts';

export class Htmxx {
  public files: HtmxxFile[];
  public dir: string;

  constructor(dir: string) {
    this.dir = dir;
    this.files = this.parseFiles(dir + '/routes');
    console.log(this.getRoutes());
  }

  public getRoutes() {
    return this.files
      .filter((file) => !utils.isHidden(file.name))
      .map((file) => file.route);
  }

  private async getErrorFile(depth: number) {
    const errorFile = utils.closestErrorFile(this.files, depth);
    return errorFile?.route || '/error';
  }

  private parseFiles(baseRoute: string, currentDir?: string) {
    const dir = currentDir ?? baseRoute;
    const dirents = readdirSync(dir, { withFileTypes: true });
    const reMethod = /\.(.+)\.ts$/;
    const reExt = /(?:\.([^.]+))?$/;
    const files = dirents
      .map((dirent) => {
        const path = resolve(dir, dirent.name);
        const depth =
          (path.match(/\//g) || []).length -
          (baseRoute.match(/\//g) || []).length;
        const extension = reExt.exec(dirent.name)?.[1];
        const hidden = dirent.name?.[0] === '_';
        const method =
          reMethod.exec(dirent.name)?.[1].toUpperCase() || ('GET' as Method);
        if (dirent.isDirectory()) {
          return this.parseFiles(baseRoute, path);
        } else {
          const route = utils.getRoute(path, baseRoute);
          const routeRe = utils.buildRouteRegex(route);
          return extension === 'ts'
            ? {
                path,
                route,
                routeRe,
                name: dirent.name,
                hidden,
                depth,
                method,
              }
            : undefined;
        }
      })
      .filter((route) => route) as HtmxxFile[];
    return Array.prototype.concat(...files);
  }

  private async processPath(req: HtmxxRequest, file: HtmxxFile) {
    const stacks = this.files
      .filter((route) => route.name === LAYOUT && route.depth <= file.depth)
      .sort((a, b) => b.depth - a.depth);

    const route = this.files.find((route) => route.path === file.path);
    if (!route) {
      throw new RedirectError(303, '/error');
    }
    let fn: HtmxxFunction = require(route.path).default;
    let markup = await fn(req, '');
    for (const stack of stacks) {
      console.log({ stack });
      fn = require(stack.path).default;
      markup = await fn(req, markup);
    }
    return markup;
  }

  public async processRoute(route: string, method: Method, req: HtmxxRequest) {
    const trimmedRoute = route.replace(/\/$/, '');
    const file = this.files.find(
      (file) => file.routeRe.exec(trimmedRoute) && file.method === method
    );
    if (!file || file.hidden) {
      if (trimmedRoute === '/error') {
        return '<h3>error</h3>';
      }
      const errorRoute = await this.getErrorFile(0);
      throw new RedirectError(303, errorRoute);
    }
    let output = '';
    try {
      req.params = utils.getParams(trimmedRoute, file);
      output = await this.processPath(req, file);
    } catch (error) {
      console.error(error);
      // eslint-disable-next-line no-prototype-builtins
      if (error?.hasOwnProperty('location')) {
        const redirection = error as RedirectError;
        throw redirection;
      }
      const errorRoute = await this.getErrorFile(file.depth);
      throw new RedirectError(303, errorRoute);
    }
    return output;
  }

  public startServer() {
    server(this);
  }
}

export const redirect = (status: number, location: string) => {
  throw new RedirectError(status, location);
};
