import { resolve } from 'path';
import mustache from 'mustache';
import { readdirSync, readFileSync } from 'fs';
import { load } from 'cheerio';
import { HtmxxFile, RedirectError } from './interfaces';
import type { Method, HtmxxRequest, Output } from './interfaces';
import * as utils from './utils';

const LAYOUT = '_layout.html';

class Htmxx {
  private routesDirectory: string;
  private files: HtmxxFile[];

  constructor(dir: string) {
    this.routesDirectory = dir;
    this.files = this.parseFiles(dir);
    console.log(this.files);
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
    const reMethod = /\.(.+)\.html$/;
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
          const $ = load(readFileSync(path));
          const route = utils.getRoute(path, baseRoute);
          const ws = $('script[server]').attr('ws');
          const script = utils.extractScript($, path);
          const partials = utils.extractPartials($);
          const routeRe = utils.buildRouteRegex(route);
          return extension === 'html'
            ? {
                path,
                route,
                routeRe,
                name: dirent.name,
                hidden,
                depth,
                method,
                script,
                partials,
                ws,
              }
            : undefined;
        }
      })
      .filter((route) => route) as HtmxxFile[];
    return Array.prototype.concat(...files);
  }

  private async processPath(req: HtmxxRequest, file: HtmxxFile) {
    const stackPartials: Record<string, string> = {};
    let isWs: boolean | undefined;
    const stacks = await Promise.all(
      this.files
        .filter(
          (currRoute) =>
            (currRoute.name === LAYOUT && currRoute.depth <= file.depth) ||
            currRoute.path === file.path
        )
        .sort((a, b) => a.depth - b.depth)
        .map(async ({ name, script, path, partials, ws }) => {
          partials.forEach(({ id, html }) => (stackPartials[id] = html));
          const fn = utils.createFunction(script);
          const props = await fn(
            req,
            require,
            (status: number, location: string) => {
              throw new RedirectError(status, location);
            }
          );
          if (file.method !== 'GET' && name === LAYOUT) {
            return '<slot></slot>';
          }
          isWs = Boolean(ws);
          const $ = load(readFileSync(path));
          $('script[type="text/html"]').replaceWith('');
          $('script[server]').replaceWith('');
          const html = $.html().replace(/\{\{&gt;/g, '{{>');
          return mustache.render(html, props, stackPartials);
        })
    );
    const markup = stacks.reduce((stacked, layout) => {
      if (stacked) {
        const $stack = load(stacked);
        if (layout) {
          $stack('slot').replaceWith(layout);
        }
        return $stack.html();
      } else {
        return layout;
      }
    }, '');
    return { ws: isWs || file.method === 'WS', markup };
  }

  public async processRoute(route: string, method: Method, req: HtmxxRequest) {
    const trimmedRoute = route.replace(/\/$/, '');
    const file = this.files.find(
      (file) => file.routeRe.exec(trimmedRoute) && file.method === method
    );
    if (!file || file.hidden) {
      const error = `${method}: route '${trimmedRoute}' not defined`;
      if (trimmedRoute === '/error') {
        return { markup: mustache.render('<h3>{{error}}</h3>', { error }) };
      }
      console.error(error);
      const errorRoute = await this.getErrorFile(0);
      return {
        redirect: { status: 303, location: errorRoute } as RedirectError,
      };
    }
    let output = {} as Output;
    try {
      req.params = utils.getParams(trimmedRoute, file);
      console.log(req.params);
      output = await this.processPath(req, file);
    } catch (error) {
      console.error(error);
      // eslint-disable-next-line no-prototype-builtins
      if (error?.hasOwnProperty('location')) {
        return { redirect: error as RedirectError };
      }
      const errorRoute = await this.getErrorFile(file.depth);
      return {
        redirect: { status: 303, location: errorRoute } as RedirectError,
      };
    }
    return output;
  }
}
module.exports = Htmxx;
