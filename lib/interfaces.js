"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedirectError = void 0;
var RedirectError = /** @class */ (function () {
    function RedirectError(status, location) {
        this.status = status;
        this.location = location;
    }
    return RedirectError;
}());
exports.RedirectError = RedirectError;
