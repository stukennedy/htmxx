import type { HtmxxFile, Method } from './interfaces';

export function isHTML(filename: string) {
  const reMethod = /\.html$/;
  return Boolean(reMethod.exec(filename));
}
export function getMethod(filename: string) {
  const reMethod = /\.(.+)\.html$/;
  return reMethod.exec(filename)?.[1].toUpperCase() || ('GET' as Method);
}
export function isHidden(filename: string) {
  return filename?.[0] === '_';
}
export function getEndpoint(filename: string) {
  const reName = /(.+)\..+$/;
  return reName.exec(filename)?.[1].replace('index', '');
}
export function isVariable(filename: string) {
  const reVar = /\/\[.+\]\..+$/;
  return reVar.exec(filename);
}

export function closestErrorFile(routes: HtmxxFile[], depth: number) {
  return routes
    .filter((route) => route.name === '_error.ts' && route.depth <= depth)
    .sort((a, b) => b.depth - a.depth)
    .at(0);
}

export function getRoute(path: string, baseRoute: string) {
  return path
    .replace(baseRoute, '')
    .replace('.ts', '')
    .replace('.ws', '')
    .replace('.post', '')
    .replace('.get', '')
    .replace('.put', '')
    .replace('.delete', '')
    .replace('.patch', '')
    .replace('index', '')
    .replace(/\/$/, '');
}

export function getParams(route: string, file: HtmxxFile) {
  const paramArray = file.route.match(/\[.+?\]/g);
  if (paramArray) {
    const valueArray = file.routeRe.exec(route)?.slice(1);
    return paramArray.reduce((prev, param, i) => {
      const idx = param.toString().replace(/\[(.+)\]/, '$1');
      if (valueArray?.[i]) {
        prev[idx] = valueArray[i];
      }
      return prev;
    }, {} as Record<string, string>);
  }
  return {} as Record<string, string>;
}

export function buildRouteRegex(route: string) {
  const text = route
    .replace(/(\[.+?\]\/)/g, '(.+)/')
    .replace(/(\[.+?\])/g, '(.+)');
  return new RegExp(`^${text}$`);
}
