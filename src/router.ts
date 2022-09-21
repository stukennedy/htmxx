import { resolve } from 'path';
import mustache from 'mustache';
import { readdirSync } from 'fs';
import type { Request } from 'express';
import { transformSync } from '@babel/core';
import { load } from 'cheerio';

const re = /(?:\.([^.]+))?$/;

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
  const reMethod = /\.(.+)\.js$/;
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
        return extension === 'js'
          ? {
              path: res,
              route: res
                .replace(baseRoute, '')
                .replace('.js', '')
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
    .filter((route) => route.name === '_error.js' && route.depth <= depth)
    .sort((a, b) => b.depth - a.depth)
    .at(0);
}

function extractPartials(content: string) {
  const $ = load(content);
  const partials: { id: string; html: string }[] = [];
  $('script[type="text/html"]').each(function (_, el) {
    const id: string | undefined = $(this).attr('id');
    const html: string | null = $(this).html();
    if (id && html) {
      partials.push({ id, html });
    }
  });
  $('script[type="text/html"]').replaceWith('');
  return { html: $.html(), partials };
}

export async function processPath(
  req: Request,
  routes: Route[],
  route: Route,
  doLayout: boolean
) {
  const partials: Record<string, string> = {};
  const files = await Promise.all(
    routes
      .filter(
        (currRoute) =>
          (doLayout &&
            currRoute.name === '_layout.js' &&
            currRoute.depth <= route.depth) ||
          currRoute.path === route.path
      )
      .sort((a, b) => a.depth - b.depth)
      .map(async ({ path }) => {
        const { script = () => ({}), template = '' } = require(path);
        const { html, partials: localPartials } = extractPartials(template);
        localPartials.forEach(({ id, html }) => (partials[id] = html));
        const exe =
          script.constructor.name === 'AsyncFunction'
            ? await script(req)
            : script(req);
        return mustache.render(
          html.replace('{{&gt;', '{{>'), // fix cheerio converting template
          exe,
          partials
        );
      })
  );
  return files.reduce((stacked, layout) => {
    if (stacked) {
      const $stack = load(stacked);
      $stack('slot').replaceWith(layout);
      return $stack.html();
    } else {
      return layout;
    }
  }, '');
}
