"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const objectToString = Object.prototype.toString;
const isError = (value) => objectToString.call(value) === "[object Error]";
const errorMessages = new Set([
    "Failed to fetch",
    "NetworkError when attempting to fetch resource.",
    "The Internet connection appears to be offline.",
    "Load failed",
    "Network request failed",
    "fetch failed", // Undici (Node.js)
]);
function isNetworkError(error) {
    const isValid = error &&
        isError(error) &&
        error.name === "TypeError" &&
        typeof error.message === "string";
    if (!isValid) {
        return false;
    }
    // We do an extra check for Safari 17+ as it has a very generic error message.
    // Network errors in Safari have no stack.
    if (error.message === "Load failed") {
        return error.stack === undefined;
    }
    return errorMessages.has(error.message);
}
exports.default = isNetworkError;
