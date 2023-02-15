"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var express_ws_1 = __importDefault(require("express-ws"));
var body_parser_1 = __importDefault(require("body-parser"));
var interfaces_1 = require("./interfaces");
function default_1(htmxx, port) {
    var _this = this;
    var PORT = Number(port || 3000);
    var app = (0, express_1.default)();
    var appWs = (0, express_ws_1.default)(app);
    app.use(body_parser_1.default.json());
    app.use(body_parser_1.default.urlencoded({ extended: true }));
    app.set('view engine', 'html');
    app.use(express_1.default.static(htmxx.dir + '/assets'));
    var getAppMethod = function (method, route, callback) {
        var paramRoute = route.replace(/\[(.+?)\]/g, ':$1');
        switch (method) {
            case 'DELETE':
                return app.delete(paramRoute, callback);
            case 'PUT':
                return app.put(paramRoute, callback);
            case 'POST':
                return app.post(paramRoute, callback);
            case 'PATCH':
                return app.patch(paramRoute, callback);
            default:
                return app.get(paramRoute, callback);
        }
    };
    var broadcast = function (markup) {
        return appWs
            .getWss()
            .clients.forEach(function (client) { return client.OPEN && client.send(markup); });
    };
    htmxx.files.forEach(function (f) {
        if (f.hidden)
            return;
        var request = {
            body: {},
            params: {},
            query: {},
            headers: {},
            redirect: function (status, location) {
                throw new interfaces_1.RedirectError(status, location);
            },
            broadcast: broadcast,
        };
        if (f.method === 'WS') {
            var paramRoute = f.route.replace(/\[(.+?)\]/g, ':$1');
            app.ws(paramRoute, function (req) {
                req.on('message', function (msg) { return __awaiter(_this, void 0, void 0, function () {
                    var markup;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                request.body = JSON.parse(String(msg) || '{}');
                                return [4 /*yield*/, htmxx.processRoute(f.route, f.method, request)];
                            case 1:
                                markup = _a.sent();
                                broadcast(markup);
                                return [2 /*return*/];
                        }
                    });
                }); });
            });
        }
        else {
            getAppMethod(f.method, f.route, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var markup, error_1, redirect;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            request.body = req.body;
                            request.params = req.params;
                            request.query = req.query;
                            request.headers = req.headers;
                            return [4 /*yield*/, htmxx.processRoute(req.originalUrl.replace(/\?.+$/, ''), f.method, request)];
                        case 1:
                            markup = _a.sent();
                            res.send(markup);
                            return [3 /*break*/, 3];
                        case 2:
                            error_1 = _a.sent();
                            // eslint-disable-next-line no-prototype-builtins
                            if (error_1 === null || error_1 === void 0 ? void 0 : error_1.hasOwnProperty('location')) {
                                redirect = error_1;
                                res.redirect(redirect.status, redirect.location);
                                return [2 /*return*/];
                            }
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
        }
    });
    app.listen(PORT, function () {
        console.log("\u26A1\uFE0F[server]: Server is running at http://localhost:".concat(PORT));
    });
}
exports.default = default_1;
