import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";
import {parseJSON} from "../../utils/Utils";
import {validateAsOrdersEntry} from "../../validators/Validators";
import {OrderEntry, OrderItemEntry} from "../../model/Models";
import {OrderEntity} from "../../entity/no-sql/Entities";
import {Connection} from "typeorm";
import {getResponseFor} from "../../utils/HttpUtils";
import {OrderDynamoDBRepository} from "../../repository/OrderDynamoDBRepository";

export async function postOrder(event: APIGatewayProxyEvent, repository: OrderDynamoDBRepository): Promise<APIGatewayProxyResult> {

    let dbConn: Connection
    try {
        const body = event.body;
        const item = parseJSON(body || "{}") as OrderEntry;
        validateAsOrdersEntry(item);

        const order = {
            id: item.id ? `${item.id}` : item.id,
            userId: item.userId,
            orderStatus: item.orderStatus,
            price: item.price,
            address: {
                id: "",
                country: item.address.country,
                city: item.address.city,
                postCode: item.address.postCode,
                street: item.address.street,
                houseNumber: item.address.houseNumber,
                localNumber: item.address.localNumber,
                createdAt: ""
            },
            items: item.items.map((i: OrderItemEntry) => ({
                id: "",
                productId: i.productId,
                productName: i.productName,
                productImg: i.productImg,
                quantity: i.quantity,
                price: i.price,
                subTotal: i.subTotal,
                createdAt: ""
            })),
            createdAt: ""
        } as OrderEntity;

        console.log("Order to save: ", order);
        const orderResult = await repository.saveWithResponseObject(order);

        console.log("await repository.save(order): ", orderResult);

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