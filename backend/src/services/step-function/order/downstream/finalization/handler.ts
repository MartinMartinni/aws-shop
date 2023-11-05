import {Database} from "../../../../component/Database";
import {Orders, OrderStatus} from "../../../../entity/sql/Orders";
import {Connection} from "typeorm";
import {OrderWorkflowType} from "../../../../model/Models";
import {APIGatewayProxyCustomEvent} from "../../../../model/HttpModels";
import {getResponseFor} from "../../../../utils/HttpUtils";
import {parseJSON} from "../../../../utils/Utils";
import {NotFoundError} from "../../../../exception/Exceptions";
import {APIGatewayProxyResult} from "aws-lambda";

const database = new Database()
export async function handler(event: APIGatewayProxyCustomEvent | APIGatewayProxyCustomEvent[]): Promise<APIGatewayProxyResult> {

    let dbConn: Connection;
    let parsedBody: any;
    let extractedEvent: APIGatewayProxyCustomEvent | undefined;
    try {
        console.log("event: ", event);

        // @ts-ignore
        extractedEvent = Array.isArray(event) ? event[0] : event;
        let workflowOrderStatus = extractedEvent?.type;

        console.log("open db connection");
        dbConn = await database.getConnection();

        if (workflowOrderStatus !== OrderWorkflowType.SHIPMENT_SUCCESS) {
            const orderStatus = OrderStatus.FAILURE;
            const causeMessage = parseJSON(extractedEvent?.Cause);
            parsedBody = parseJSON(causeMessage.errorMessage);
            await updateOrderStatusById(dbConn, parsedBody.orderId, orderStatus);
            return getResponseFor(200, {
                status: orderStatus,
                errorMessage: causeMessage.errorMessage,
                executionName: parsedBody.executionName
            })
        }
        
        const body = extractedEvent.body;

        parsedBody = parseJSON(body);
        const orderStatus = OrderStatus.COMPLETED;
        await updateOrderStatusById(dbConn, parsedBody.order.id, orderStatus);

        return getResponseFor(200, {
            status: orderStatus,
            executionName: extractedEvent.workflowProps.executionName,
        })

    } catch (e) {
        console.error("Error: ", e);
        const error = e as Error;
        return getResponseFor(500, {
                executionName: extractedEvent?.workflowProps ? extractedEvent?.workflowProps.executionName : "UNKNOWN_EXECUTION_NAME",
                status: OrderStatus.FAILURE,
                errorMessage: JSON.stringify({
                    exception: {
                        message: error.message
                    }
                })
            });
    } finally {
        // @ts-ignore
        if (dbConn) {
            console.log("close db connection");
            await dbConn.close();
        }
    }
}

async function updateOrderStatusById(dbConn: Connection, orderId: number, orderStatus: OrderStatus) {
    const orderRepository = dbConn.getRepository(Orders);
    const orderToSave = await orderRepository.findOneBy({
        id: orderId
    });

    if (!orderToSave) {
        throw new NotFoundError("Order", [{
            name: "id",
            value: `${orderId}`
        }])
    }

    console.log(`Order: ${JSON.stringify(orderToSave)} by id: ${orderId}`);

    orderToSave.orderStatus = orderStatus;
    const savedOrder = await orderRepository.save(orderToSave);

    console.log("saved Order: ", savedOrder);
}