import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";
import {parseJSON} from "../../../../utils/Utils";
import {validateAsPlaceOrderEntry} from "../../../../validators/Validators";
import {PlaceOrderEntry} from "../../../../model/Models";
import {Orders} from "../../../../entity/sql/Orders";
import {Connection} from "typeorm";
import {Database} from "../../../../component/Database";
import {NotFoundError} from "../../../../exception/Exceptions";
import {getResponseFor} from "../../../../utils/HttpUtils";
import {APIGatewayProxyCustomEvent} from "../../../../model/HttpModels";

export async function postPlaceOrder(event: APIGatewayProxyCustomEvent, database: Database): Promise<APIGatewayProxyResult> {

    let dbConn: Connection
    try {
        const body = event.body;

        const item = parseJSON(body) as PlaceOrderEntry;
        validateAsPlaceOrderEntry(item);

        console.log("open db connection");
        dbConn = await database.getConnection();

        const order = await dbConn.getRepository(Orders).findOneBy({
            id: item.orderId,
            userId: item.userId
        });

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