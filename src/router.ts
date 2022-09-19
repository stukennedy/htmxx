import { resolve } from 'path';
import mustache from 'mustache';
import { readdirSync, readFileSync } from 'fs';
import type { Request } from 'express';

const re = /(?:\.([^.]+))?$/;
const reMethod = /\.(.+)\.html$/;
const extensions = ['html'];

export type Method = 'GET' | 'POST' | 'PUT' | 'UPDATE' | 'DELETE';

export type Route = {
  path: string;
  route: string;
  name: string;
  hidden: boolean;
  depth: number;
  method: Method;
};

export function getFiles(baseRoute: string, dir: string) {
  const dirents = readdirSync(dir, { withFileTypes: true });
  const files: any[] = dirents.map((dirent) => {
    const res = resolve(dir, dirent.name);
    const depth =
      (res.match(/\//g) || []).length - (baseRoute.match(/\//g) || []).length;
    const extension = re.exec(dirent.name)?.[1];
    const hidden = dirent.name?.[0] === '_';
    const method = reMethod.exec(dirent.name)?.[1].toUpperCase();
    return dirent.isDirectory()
      ? getFiles(baseRoute, res)
      : {
          path: res,
          route: res
            .replace(baseRoute, '')
            .replace('.html', '')
            .replace('.post', '')
            .replace('.get', '')
            .replace('.update', '')
            .replace('.put', '')
            .replace('.delete', '')
            .replace('index', ''),
          name: dirent.name,
          hidden,
          depth,
          method,
        };
  });
  return Array.prototype.concat(...files);
}

export function closestErrorFile(routes: Route[], depth: number) {
  return routes
    .filter((route) => route.name === '_error.html' && route.depth <= depth)
    .sort((a, b) => b.depth - a.depth)
    .at(0);
}

export function stackLayouts(routes: Route[], depth: number) {
  return routes
    .filter((route) => route.name === '_layout.html' && route.depth <= depth)
    .sort((a, b) => a.depth - b.depth)
    .reduce((acc: string, layout: Route) => {
      const contents = readFileSync(layout.path, 'utf8');
      const match = scriptRe.exec(contents);
      const scriptCode = match?.[1] || '';
      const script = match?.[0] || '';
      const result = eval('(function() {' + scriptCode + '}())');
      const output = mustache.render(contents.replace(script, ''), result);
      if (acc == '') {
        return output;
      } else {
        return acc.replace('<slot />', output);
      }
    }, '');
}

const scriptRe = /<script\b[^>]*>([\s\S]*?)<\/script>/m;
export function processFile(
  req: Request,
  routes: Route[],
  route: Route,
  doLayout: boolean
) {
  const contents = readFileSync(route.path, 'utf8');
  const match = scriptRe.exec(contents);
  const scriptCode = match?.[1] || '';
  const script = match?.[0] || '';
  const layout = doLayout ? stackLayouts(routes, route.depth) : '';
  const result = eval(`(function(request) {${scriptCode}}(${req}))`);
  const output = mustache.render(contents.replace(script, ''), result);
  if (layout != '') {
    return layout.replace('<slot />', output);
  }
  return output;
}
