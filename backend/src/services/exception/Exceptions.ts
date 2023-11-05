import {ProductsUnavailable} from "../model/Models";

export interface RequestErrorField {
    name: string;
    path: string;
}

export interface ErrorField {
    name: string;
    value: string;
}

export class RequestValidationError extends Error {

    public readonly queryParameters: string[];
    public readonly requestBodyFields: RequestErrorField[];

    constructor(message: string, queryParameters: string[], requestBodyFields: RequestErrorField[]) {
        super(message);
        this.queryParameters = queryParameters;
        this.requestBodyFields = requestBodyFields;

        Object.setPrototypeOf(this, RequestValidationError.prototype);
    }
}

export class RequiredFieldRequestValidationError extends RequestValidationError {

    constructor(queryParameters: string[], requestBodyFields: RequestErrorField[]) {
        super("Required field", queryParameters, requestBodyFields);

        Object.setPrototypeOf(this, RequiredFieldRequestValidationError.prototype);
    }
}

export interface GeneralExceptionProps {
    orderId: string
    executionName: string
}

export class GeneralException extends Error {
    public readonly executionName: string;

    constructor(exception: Error, props: GeneralExceptionProps) {
        super(JSON.stringify({
            ...props,
            exception
        }));
        this.name = exception.name;

        Object.setPrototypeOf(this, GeneralException.prototype);
    }
}

export class NotFoundError extends Error {

    public readonly domain: string;
    public readonly fields: ErrorField[];

    constructor(domain: string, fields: ErrorField[]) {
        super();
        this.domain = domain;
        this.fields = fields;
        this.name = "NotFoundError";
        this.message = this.buildMessage();

        Object.setPrototypeOf(this, NotFoundError.prototype);
    }

    private buildMessage() : string {
        const fieldMessages = this.fields.map(field => `by "${field.name}": "${field.value}"`);
        return `Order ${fieldMessages.join(" and ")} not found!`;

    }
}

export class ProductsUnavailableError extends Error {

    public readonly productsUnavailable: ProductsUnavailable[];
    constructor(productsUnavailable: ProductsUnavailable[]) {
        super();
        this.productsUnavailable = productsUnavailable;
        this.name = "ProductsUnavailableError";
        this.message = this.buildMessage();

        Object.setPrototypeOf(this, ProductsUnavailableError.prototype);
    }

    private buildMessage() : string {
        const fieldMessages = this.productsUnavailable.map(product => `by "id": "${product.id}", by "name": "${product.name}"`);
        return `Products ${fieldMessages.join(" and ")} not available!`;
    }
}

export class WrongOrderPriceError extends Error {

    public readonly frontend: number;
    public readonly backend: number;

    constructor(frontend: number, backend: number) {
        super();
        this.frontend = frontend;
        this.backend = backend;
        this.name = "WrongOrderPriceError";
        this.message = this.buildMessage();

        Object.setPrototypeOf(this, WrongOrderPriceError.prototype);
    }

    private buildMessage() {
        return `Order prices provided: "${this.frontend}" and calculated: "${this.backend}" are not the same!`;
    }
}

export class UserDoesNotHaveEnoughOfMoney extends Error {

    constructor() {
        super();
        this.message = "User doesn't have enough of money to fulfilment order";
        this.name = "UserDoesNotHaveEnoughOfMoney";

        Object.setPrototypeOf(this, UserDoesNotHaveEnoughOfMoney.prototype);

    }
}

export class JSONError extends Error {}