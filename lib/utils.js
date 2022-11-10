"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRouteRegex = exports.getParams = exports.getRoute = exports.closestErrorFile = exports.isVariable = exports.getEndpoint = exports.isHidden = exports.getMethod = exports.isHTML = void 0;
function isHTML(filename) {
    var reMethod = /\.html$/;
    return Boolean(reMethod.exec(filename));
}
exports.isHTML = isHTML;
function getMethod(filename) {
    var _a;
    var reMethod = /\.(.+)\.html$/;
    return ((_a = reMethod.exec(filename)) === null || _a === void 0 ? void 0 : _a[1].toUpperCase()) || 'GET';
}
exports.getMethod = getMethod;
function isHidden(filename) {
    return (filename === null || filename === void 0 ? void 0 : filename[0]) === '_';
}
exports.isHidden = isHidden;
function getEndpoint(filename) {
    var _a;
    var reName = /(.+)\..+$/;
    return (_a = reName.exec(filename)) === null || _a === void 0 ? void 0 : _a[1].replace('index', '');
}
exports.getEndpoint = getEndpoint;
function isVariable(filename) {
    var reVar = /\/\[.+\]\..+$/;
    return reVar.exec(filename);
}
exports.isVariable = isVariable;
function closestErrorFile(routes, depth) {
    return routes
        .filter(function (route) { return route.name === '_error.ts' && route.depth <= depth; })
        .sort(function (a, b) { return b.depth - a.depth; })
        .at(0);
}
exports.closestErrorFile = closestErrorFile;
function getRoute(path, baseRoute) {
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
exports.getRoute = getRoute;
function getParams(route, file) {
    var _a;
    var paramArray = file.route.match(/\[.+\]/g);
    if (paramArray) {
        var valueArray_1 = (_a = file.routeRe.exec(route)) === null || _a === void 0 ? void 0 : _a.slice(1);
        return paramArray.reduce(function (prev, param, i) {
            var idx = param.toString().replace(/\[(.+)\]/, '$1');
            if (valueArray_1 === null || valueArray_1 === void 0 ? void 0 : valueArray_1[i]) {
                prev[idx] = valueArray_1[i];
            }
            return prev;
        }, {});
    }
    return {};
}
exports.getParams = getParams;
function buildRouteRegex(route) {
    var text = route
        .replace(/(\[.+?\]\/)/g, '(.+)/')
        .replace(/(\[.+?\])/g, '(.+)');
    return new RegExp("^".concat(text, "$"));
}
exports.buildRouteRegex = buildRouteRegex;
