export declare class HttpError extends Error {
    readonly response: Response;
    constructor(response: Response);
}
