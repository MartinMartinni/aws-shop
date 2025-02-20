import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";
import {parseJSON} from "../../utils/Utils";
import {validateAsOrdersEntry} from "../../validators/Validators";
import {OrderEntry} from "../../model/Models";
import {Database} from "../../component/Database";
import {Connection} from "typeorm";
import {Orders} from "../../entity/sql/Orders";
import {OrderItems} from "../../entity/sql/OrderItems";
import {getResponseFor} from "../../utils/HttpUtils";

export async function postOrder(event: APIGatewayProxyEvent, database: Database): Promise<APIGatewayProxyResult> {

    let dbConn: Connection
    try {
        const body = event.body;
        const item = parseJSON(body || "{}") as OrderEntry;
        validateAsOrdersEntry(item);

        console.log("open db connection");
        dbConn = await database.getConnection();
        const order = new Orders();
        order.id = item.id;
        order.userId = item.userId;
        order.orderStatus = item.orderStatus;
        order.price = item.price;
        order.address = item.address;
        order.items = item.items.map(i => {
            const orderItems = new OrderItems();
            orderItems.productId = i.productId;
            orderItems.productName = i.productName;
            orderItems.productImg = i.productImg
            orderItems.quantity = i.quantity;
            orderItems.price = i.price;
            orderItems.subTotal = i.subTotal;
            return orderItems;
        })

        const orderResult = await dbConn.getRepository(Orders).save(order);

        return getResponseFor(201, orderResult);
    } catch (e) {
        throw e;
    } finally {
        // @ts-ignore
        if (dbConn) {
            console.log("close db connection");
            await dbConn.close();
        }
    }
}