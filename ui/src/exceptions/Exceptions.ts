export class HttpError extends Error {

    public readonly response: Response;
    constructor(response: Response) {
        super()
        this.response = response;

        Object.setPrototypeOf(this, HttpError.prototype);
    }
}