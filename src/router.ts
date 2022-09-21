import { resolve } from 'path';
import mustache from 'mustache';
import { readdirSync, readFileSync } from 'fs';
import type { Request } from 'express';
import { transformSync } from '@babel/core';
import { load } from 'cheerio';

const re = /(?:\.([^.]+))?$/;
const reMethod = /\.(.+)\.html$/;

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
  const files: any[] = dirents
    .map((dirent) => {
      const res = resolve(dir, dirent.name);
      const depth =
        (res.match(/\//g) || []).length - (baseRoute.match(/\//g) || []).length;
      const extension = re.exec(dirent.name)?.[1];
      const hidden = dirent.name?.[0] === '_';
      const method = reMethod.exec(dirent.name)?.[1].toUpperCase() || 'GET';
      if (dirent.isDirectory()) {
        return getFiles(baseRoute, res);
      } else {
        return extension === 'html'
          ? {
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
            }
          : undefined;
      }
    })
    .filter((route) => route);
  return Array.prototype.concat(...files);
}

export function closestErrorFile(routes: Route[], depth: number) {
  return routes
    .filter((route) => route.name === '_error.html' && route.depth <= depth)
    .sort((a, b) => b.depth - a.depth)
    .at(0);
}

const fragmentRe = /(<script\s+type="text\/html".+>[\s\S]*?<\/script>)/gm;
export function stackLayouts(routes: Route[], depth: number) {
  return routes
    .filter((route) => route.name === '_layout.html' && route.depth <= depth)
    .sort((a, b) => a.depth - b.depth)
    .reduce((stacked: string, layout: Route) => {
      const contents = readFileSync(layout.path, 'utf8');
      const match = scriptRe.exec(contents);
      const scriptCode = match?.[1] || '';
      const script = match?.[0] || '';
      const fragments = Array.from(contents.matchAll(fragmentRe));
      const strippedContent = fragments.reduce((acc, [key, value]) => {
        return acc.replace(value, '');
      }, contents.replace(script, ''));
      const result = eval('(function() {' + scriptCode + '}())');
      const withoutFrags = mustache.render(strippedContent, result);
      const appendedFrags = fragments.reduce((acc, [key, value]) => {
        return acc + '/n' + value;
      }, withoutFrags);
      if (stacked == '') {
        return appendedFrags;
      } else {
        return stacked.replace('<slot />', appendedFrags);
      }
    }, '');
}

const scriptRe = /<script\s+type="module">([\s\S]*?)<\/script>/m;
const partialRe = /\{\{> (.+)\}\}/gm;
export function processFile(
  req: Request,
  routes: Route[],
  route: Route,
  doLayout: boolean
) {
  const path = route.path;
  const contents = readFileSync(path, 'utf8');
  const match = scriptRe.exec(contents);
  const scriptCode = match?.[1] || '';
  const script = match?.[0] || '';
  const layout = doLayout ? stackLayouts(routes, route.depth) : '';
  const { params, query, body } = req;
  const result = transformSync(
    `(function() {
      const params = ${JSON.stringify(params)};
      const query = ${JSON.stringify(query)};
      const body = ${JSON.stringify(body)};
      ${scriptCode}
    }())`
  );
  const currentPath = path.substr(0, path.lastIndexOf('/'));
  const code =
    result?.code?.replace("require('.", `require('${currentPath}`) || '';
  const exe = eval(code);
  const template = contents.replace(script, '');
  const partialMatch = template.matchAll(partialRe);
  const $ = load(layout.replace('<slot />', template));
  const partials = Array.from(partialMatch).reduce(
    (acc: Record<string, string>, [key, value]) => {
      const partial = $(`#${value}`).html();
      if (partial) {
        acc[value] = partial;
      }
      return acc;
    },
    {}
  );
  const output = mustache.render(template, exe, partials);
  if (layout != '') {
    return layout.replace('<slot />', output);
  }
  return output;
}
