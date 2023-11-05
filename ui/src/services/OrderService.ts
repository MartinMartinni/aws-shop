import {Order} from "../model/Models.ts";
import {RestApiStack, StepFunctionOrderWorkflowStack} from "../../cdk-outputs.json";
import {AbstractService} from "./AbstractService.ts";
import {HttpService} from "./HttpService.ts";

export class OrderService extends AbstractService<Order> {

    constructor() {
        super(RestApiStack.RestApiEndpoint0551178A + "orders")
    }
    public async findAllActiveByUserId(userId: string) : Promise<Order[]> {
        try {
            const response = await HttpService.fetch(`${this.url}/${userId}/active`, {
                method: "GET"
            })
            return await response.json() as Order[];
        } catch (e) {
            console.error("Error: ", e);
            return [];
        }
    }

    public async findAllFulfilment(userId?: string) : Promise<Order[]> {
        try {
            const result = await HttpService.fetch(`${this.url}?orderStatus=COMPLETED${userId ? "&userId=" + userId : ""}`, {
                method: "GET",
            });
            return await result.json() as Order[];
        } catch (e) {
            console.error("Error: ", e);
            return [];
        }
    }

    public async place(orderId: string,
                       userId: string,
                       executionName: string) : Promise<{
        executionName: string
    } | undefined> {
        try {
            const body = JSON.stringify({
                orderId,
                userId,
            });

            const requestPayload = {
                body,
                workflowProps: {
                    orderId: orderId,
                    executionName: executionName
                },
                stateMachineArn: StepFunctionOrderWorkflowStack.ExportsOutputRefStateMachineOrderWorkflow60C9B792FEEA296C
            };
            const response = await HttpService.fetch(this.websocketUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestPayload)
            });

            const result = await response.json() as {
                executionArn: string,
                startDate: string
            };

            if (!result.executionArn && !result.startDate) {
                return undefined;
            }

            return { executionName };
        } catch (e) {
            return undefined
        }
    }
}