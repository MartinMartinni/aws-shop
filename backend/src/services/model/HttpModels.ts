import {APIGatewayProxyEvent} from "aws-lambda";
import {OrderWorkflowType} from "./Models";

export type WorkflowProps = {
    orderId: string
    executionName: string
}

export type Detail = {
    Message: Message;
}

export type Message = {
    body: string
}

export type APIGatewayProxyCustomEvent = {
    detail: Detail
    workflowProps: WorkflowProps,
    type?: OrderWorkflowType,
    Cause: {
        errorMessage: string
    }
} & APIGatewayProxyEvent;