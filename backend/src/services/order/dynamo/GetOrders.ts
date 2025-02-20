import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";
import {Connection} from "typeorm";
import {NotFoundError, RequiredFieldRequestValidationError} from "../../exception/Exceptions";
import {getResponseFor} from "../../utils/HttpUtils";
import {OrderDynamoDBRepository} from "../../repository/OrderDynamoDBRepository";
import {OrderStatus} from "../../model/Models";

export async function getOrders(event: APIGatewayProxyEvent, repository:  OrderDynamoDBRepository): Promise<APIGatewayProxyResult> {

    let dbConn: Connection;
    try {
        const queryStringParameters = event.queryStringParameters;
        console.log("queryStringParameters: ", queryStringParameters);
        if (queryStringParameters) {
            const requiredProperties = ["id", "userId", "orderStatus"];

            const existingProperties = requiredProperties.filter(prop => prop in queryStringParameters);

            if (existingProperties.length > 0) {
                console.log("open db connection");

                const queryConditions: { [key: string]: string | number } = {};

                for (const prop of existingProperties) {
                    const value = queryStringParameters[prop]!;
                    queryConditions[prop] = prop === "id" ? value : value;
                }

                // const orderResult = await dbConn.getRepository(Orders).findBy(queryConditions);
                const orderResult = await repository.findAllBy({AND: queryConditions, IN: {}});

                console.log("await repository.findAllBy({AND: queryConditions, IN: {}}): ", orderResult);

                if (orderResult) {
                    return getResponseFor(200, orderResult);
                }

                throw new NotFoundError("Order", existingProperties.map(prop => ({
                    name: prop,
                    value: queryStringParameters[prop] || ''
                })));
            }

            throw new RequiredFieldRequestValidationError(["id", "userId", "orderStatus"], []);
        }

        if (event.pathParameters && event.pathParameters["userId"] && event.path.includes("/active")) {

            const userId = event.pathParameters["userId"];
            const orders = await repository.findAllBy({
                AND: {
                    userId: userId
                },
                IN: {
                    orderStatus: [OrderStatus.PENDING, OrderStatus.FAILURE]
                }
            });
            //todo: in query

            console.log("orders active: ", orders);

            return getResponseFor(200, orders);
        }

        const orderResult = await repository.findAll();

        return getResponseFor(200, orderResult);
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
