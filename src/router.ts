import { resolve } from 'path';
// import { readdirSync } from 'fs';
import { readdir, readFile } from 'fs/promises';
import mustache from 'mustache';
import { readFileSync } from 'fs';

const re = /(?:\.([^.]+))?$/;
const extensions = ['html'];

export type Route = {
  path: string;
  route: string;
  name: string;
  hidden: boolean;
  depth: number;
};

export async function getFiles(baseRoute: string, dir: string) {
  const dirents = await readdir(dir, { withFileTypes: true });
  const files: any[] = await Promise.all(
    dirents.map((dirent) => {
      const res = resolve(dir, dirent.name);
      const depth =
        (res.match(/\//g) || []).length - (baseRoute.match(/\//g) || []).length;
      const extension = re.exec(dirent.name)?.[1];
      const hidden = dirent.name?.[0] === '_';
      return dirent.isDirectory()
        ? getFiles(baseRoute, res)
        : {
            path: res,
            route: res
              .replace(baseRoute, '')
              .replace('.html', '')
              .replace('index', ''),
            name: dirent.name,
            hidden,
            depth,
          };
    })
  );
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
export async function processFile(
  routes: Route[],
  route: Route,
  doLayout: boolean
) {
  const contents = await readFile(route.path, 'utf8');
  const match = scriptRe.exec(contents);
  const scriptCode = match?.[1] || '';
  const script = match?.[0] || '';
  const layout = doLayout ? stackLayouts(routes, route.depth) : '';
  const result = eval('(function() {' + scriptCode + '}())');
  const output = mustache.render(contents.replace(script, ''), result);
  if (layout != '') {
    return layout.replace('<slot />', output);
  }
  return output;
}
