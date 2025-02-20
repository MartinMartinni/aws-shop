import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";
import {Database} from "../../component/Database";
import {Connection} from "typeorm";
import {Orders} from "../../entity/sql/Orders";
import {OrderStatus} from "../../model/Models";
import {NotFoundError, RequiredFieldRequestValidationError} from "../../exception/Exceptions";
import {getResponseFor} from "../../utils/HttpUtils";

export async function getOrders(event: APIGatewayProxyEvent, database: Database): Promise<APIGatewayProxyResult> {

    let dbConn: Connection;
    try {
        const queryStringParameters = event.queryStringParameters;
        console.log("queryStringParameters: ", queryStringParameters);
        if (queryStringParameters) {
            const requiredProperties = ["id", "userId", "orderStatus"];

            const existingProperties = requiredProperties.filter(prop => prop in queryStringParameters);

            if (existingProperties.length > 0) {
                console.log("open db connection");
                dbConn = await database.getConnection();

                const queryConditions: { [key: string]: string | number } = {};

                for (const prop of existingProperties) {
                    const value = queryStringParameters[prop]!;
                    queryConditions[prop] = prop === "id" ? parseInt(value) : value;
                }

                const orderResult = await dbConn.getRepository(Orders).findBy(queryConditions);

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
            dbConn = await database.getConnection();

            const userId = event.pathParameters["userId"];
            const orders = await dbConn.getRepository(Orders).find({
                where: [
                    { userId: userId, orderStatus: OrderStatus.PENDING },
                    { userId: userId, orderStatus: OrderStatus.FAILURE }
                ]
            });

            console.log("orders active: ", orders);

            return getResponseFor(200, orders);
        }

        dbConn = await database.getConnection();

        const orderResult = await dbConn.getRepository(Orders).find();

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
