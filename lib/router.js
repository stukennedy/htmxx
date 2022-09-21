"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processFile = exports.stackLayouts = exports.closestErrorFile = exports.getFiles = void 0;
const path_1 = require("path");
const mustache_1 = __importDefault(require("mustache"));
const fs_1 = require("fs");
const core_1 = require("@babel/core");
const cheerio_1 = require("cheerio");
const re = /(?:\.([^.]+))?$/;
const reMethod = /\.(.+)\.html$/;
function getFiles(baseRoute, dir) {
    const dirents = (0, fs_1.readdirSync)(dir, { withFileTypes: true });
    const files = dirents
        .map((dirent) => {
        var _a, _b, _c;
        const res = (0, path_1.resolve)(dir, dirent.name);
        const depth = (res.match(/\//g) || []).length - (baseRoute.match(/\//g) || []).length;
        const extension = (_a = re.exec(dirent.name)) === null || _a === void 0 ? void 0 : _a[1];
        const hidden = ((_b = dirent.name) === null || _b === void 0 ? void 0 : _b[0]) === '_';
        const method = ((_c = reMethod.exec(dirent.name)) === null || _c === void 0 ? void 0 : _c[1].toUpperCase()) || 'GET';
        if (dirent.isDirectory()) {
            return getFiles(baseRoute, res);
        }
        else {
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
exports.getFiles = getFiles;
function closestErrorFile(routes, depth) {
    return routes
        .filter((route) => route.name === '_error.html' && route.depth <= depth)
        .sort((a, b) => b.depth - a.depth)
        .at(0);
}
exports.closestErrorFile = closestErrorFile;
const evaluateScript = (req, scriptCode, path) => {
    var _a;
    const { params, query, body } = req;
    const result = (0, core_1.transformSync)(`(function() {
      const params = ${JSON.stringify(params)};
      const query = ${JSON.stringify(query)};
      const body = ${JSON.stringify(body)};
      ${scriptCode}
    }())`);
    const currentPath = path.substr(0, path.lastIndexOf('/'));
    const code = ((_a = result === null || result === void 0 ? void 0 : result.code) === null || _a === void 0 ? void 0 : _a.replace("require('.", `require('${currentPath}`)) || '';
    return eval(code);
};
const fragmentRe = /(<script\s+type="text\/html".+>[\s\S]*?<\/script>)/gm;
function stackLayouts(req, routes, route) {
    return routes
        .filter((currRoute) => currRoute.name === '_layout.html' && currRoute.depth <= route.depth)
        .sort((a, b) => a.depth - b.depth)
        .reduce((stacked, layout) => {
        const contents = (0, fs_1.readFileSync)(layout.path, 'utf8');
        const match = scriptRe.exec(contents);
        const scriptCode = (match === null || match === void 0 ? void 0 : match[1]) || '';
        const script = (match === null || match === void 0 ? void 0 : match[0]) || '';
        const fragments = Array.from(contents.matchAll(fragmentRe));
        const strippedContent = fragments.reduce((acc, [key, value]) => {
            return acc.replace(value, '');
        }, contents.replace(script, ''));
        const result = evaluateScript(req, scriptCode, route.path);
        const withoutFrags = mustache_1.default.render(strippedContent, result);
        const appendedFrags = fragments.reduce((acc, [key, value]) => {
            return acc + '/n' + value;
        }, withoutFrags);
        if (stacked == '') {
            return appendedFrags;
        }
        else {
            return stacked.replace('<slot />', appendedFrags);
        }
    }, '');
}
exports.stackLayouts = stackLayouts;
const scriptRe = /<script\s+type="module">([\s\S]*?)<\/script>/m;
const partialRe = /\{\{> (.+)\}\}/gm;
function processFile(req, routes, route, doLayout) {
    const path = route.path;
    const contents = (0, fs_1.readFileSync)(path, 'utf8');
    const match = scriptRe.exec(contents);
    const scriptCode = (match === null || match === void 0 ? void 0 : match[1]) || '';
    const script = (match === null || match === void 0 ? void 0 : match[0]) || '';
    const layout = doLayout ? stackLayouts(req, routes, route) : '';
    const exe = evaluateScript(req, scriptCode, path);
    const template = contents.replace(script, '');
    const partialMatch = template.matchAll(partialRe);
    const $ = (0, cheerio_1.load)(layout.replace('<slot />', template));
    const partials = Array.from(partialMatch).reduce((acc, [key, value]) => {
        const partial = $(`#${value}`).html();
        if (partial) {
            acc[value] = partial;
        }
        return acc;
    }, {});
    const output = mustache_1.default.render(template, exe, partials);
    if (layout != '') {
        return layout.replace('<slot />', output);
    }
    return output;
}
exports.processFile = processFile;
