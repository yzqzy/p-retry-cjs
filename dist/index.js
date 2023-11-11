"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbortError = void 0;
const retry_1 = __importDefault(require("retry"));
const isNetworkError_1 = __importDefault(require("./isNetworkError"));
class AbortError extends Error {
    constructor(message) {
        super();
        Object.defineProperty(this, "originalError", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        if (message instanceof Error) {
            this.originalError = message;
            ({ message } = message);
        }
        else {
            this.originalError = new Error(message);
            this.originalError.stack = this.stack;
        }
        this.name = "AbortError";
        this.message = message;
    }
}
exports.AbortError = AbortError;
const decorateErrorWithCounts = (error, attemptNumber, options) => {
    // Minus 1 from attemptNumber because the first attempt does not count as a retry
    const retriesLeft = options.retries - (attemptNumber - 1);
    error.attemptNumber = attemptNumber;
    error.retriesLeft = retriesLeft;
    return error;
};
async function pRetry(input, options) {
    return new Promise((resolve, reject) => {
        options = {
            onFailedAttempt() { },
            retries: 10,
            ...options,
        };
        const operation = retry_1.default.operation(options);
        const abortHandler = () => {
            var _a;
            operation.stop();
            reject((_a = options.signal) === null || _a === void 0 ? void 0 : _a.reason);
        };
        if (options.signal && !options.signal.aborted) {
            options.signal.addEventListener("abort", abortHandler, { once: true });
        }
        const cleanUp = () => {
            var _a;
            (_a = options.signal) === null || _a === void 0 ? void 0 : _a.removeEventListener("abort", abortHandler);
            operation.stop();
        };
        operation.attempt(async (attemptNumber) => {
            try {
                const result = await input(attemptNumber);
                cleanUp();
                resolve(result);
            }
            catch (error) {
                try {
                    if (!(error instanceof Error)) {
                        throw new TypeError(`Non-error was thrown: "${error}". You should only throw errors.`);
                    }
                    if (error instanceof AbortError) {
                        throw error.originalError;
                    }
                    if (error instanceof TypeError && !(0, isNetworkError_1.default)(error)) {
                        throw error;
                    }
                    await options.onFailedAttempt(decorateErrorWithCounts(error, attemptNumber, options));
                    if (!operation.retry(error)) {
                        throw operation.mainError();
                    }
                }
                catch (finalError) {
                    decorateErrorWithCounts(finalError, attemptNumber, options);
                    cleanUp();
                    reject(finalError);
                }
            }
        });
    });
}
exports.default = pRetry;
