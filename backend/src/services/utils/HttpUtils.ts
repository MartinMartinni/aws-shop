import {APIGatewayProxyResult} from "aws-lambda";
import {JSONError, NotFoundError, RequestErrorField, RequestValidationError} from "../exception/Exceptions";
import {OrderWorkflowType, WorkflowStatus} from "../model/Models";
import {WorkflowProps} from "../model/HttpModels";

export function addCorsHeader(arg: APIGatewayProxyResult) {
    if(!arg.headers) {
        arg.headers = {}
    }
    arg.headers["Access-Control-Allow-Origin"] = "*";
    arg.headers["Access-Control-Allow-Methods"] = "*";
}

export function getErrorResponse(e: Error) : APIGatewayProxyResult {
    if (e instanceof JSONError) {
        return getResponseFor(400, {
            message: e.message
        });
    } else if (e instanceof RequestValidationError) {
        return getResponseFor400(e);
    } else if (e instanceof NotFoundError) {
        return getResponseFor404(e);
    } else {
        return getResponseFor500(e);
    }
}

export function getResponseFor400(e: RequestValidationError) : APIGatewayProxyResult {
    return getResponseFor(400, {
        message: "Bad request",
        queryParameters: e.queryParameters,
        requestBodyFields: e.requestBodyFields.map(field => ({
            ...field,
            message: e.message
        })),
    });
}

export function getResponseFor404(e: NotFoundError) : APIGatewayProxyResult {
    return getResponseFor(404, {
        message: `${e.domain} ${e.fields.reduce((acc, currVal) => {
            const first = acc.concat("by '" + currVal.name + "' : " + currVal.value);
            return acc ? " and "  + first : first;
        }, "")} ${e.message}`,
    });
}

export function getResponseFor405(httpMethod: string) : APIGatewayProxyResult {
    return getResponseFor(405, {
        message: `Method: '${httpMethod}' not allowed!`,
    });
}

export function getResponseFor500(e: Error) : APIGatewayProxyResult {
    return getResponseFor(500, {
        message: `Internal server error: ${e.message}`,
    });
}

export interface ResponseProps {
    type?: OrderWorkflowType
    workflowProps: WorkflowProps
}

export function getResponseFor(statusCode: number, body: any, responseProps?: ResponseProps) : APIGatewayProxyResult {
    return {
        statusCode: statusCode,
        body: JSON.stringify(body),
        ...responseProps
    }
}