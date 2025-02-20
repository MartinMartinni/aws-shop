import {APIGatewayProxyResult} from "aws-lambda";
import {parseJSON} from "../../../../../utils/Utils";
import {validateAsPlaceOrderEntry} from "../../../../../validators/Validators";
import {PlaceOrderEntry} from "../../../../../model/Models";
import {Connection} from "typeorm";
import {NotFoundError} from "../../../../../exception/Exceptions";
import {getResponseFor} from "../../../../../utils/HttpUtils";
import {APIGatewayProxyCustomEvent} from "../../../../../model/HttpModels";
import {OrderDynamoDBRepository} from "../../../../../repository/OrderDynamoDBRepository";

export async function postPlaceOrder(event: APIGatewayProxyCustomEvent, repository: OrderDynamoDBRepository): Promise<APIGatewayProxyResult> {

    let dbConn: Connection
    try {
        const body = event.body;

        const item = parseJSON(body) as PlaceOrderEntry;
        validateAsPlaceOrderEntry(item);

        console.log("open db connection");

        const order = await repository.findOneBy({
            AND: {
                id: item.orderId,
                userId: item.userId
            },
            IN: {}
        });

        console.log("repository.findOneBy(): ", order);

        if (!order) {
            throw new NotFoundError("Order", [{
                name: "id",
                value: `${item.orderId}`
            },
            {
                name: "userId",
                value: `${item.userId}`
            }]);
        }

        return getResponseFor(200, {order}, {
            workflowProps: event.workflowProps
        });
    } finally {
        // @ts-ignore
        if (dbConn) {
            console.log("close db connection");
            await dbConn.close();
        }
    }
}