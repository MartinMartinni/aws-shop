import { Order } from "../model/Models.ts";
import { AbstractService } from "./AbstractService.ts";
export declare class OrderService extends AbstractService<Order> {
    constructor();
    findAllActiveByUserId(userId: string): Promise<Order[]>;
    findAllFulfilment(userId?: string): Promise<Order[]>;
    place(orderId: string, userId: string, executionName: string): Promise<{
        executionName: string;
    } | undefined>;
}
