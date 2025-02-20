import {APIGatewayProxyEvent, APIGatewayProxyResult, Context} from "aws-lambda";
import {getOrders} from "./GetOrders";
import {postOrder} from "./PostOrder";
import {Database} from "../../component/Database";
import {
    addCorsHeader,
    getErrorResponse,
    getResponseFor405,
} from "../../utils/HttpUtils";

async function handler(event: APIGatewayProxyEvent, context: Context) : Promise<APIGatewayProxyResult> {

    let response: APIGatewayProxyResult;

    try {
        console.log("event: ", event);
        console.log("Incoming request: " + event.path + " \n" +
            "- queryParameters: " + JSON.stringify(event.queryStringParameters) + "\n" +
            "- body: " + JSON.stringify(event.body));

        const database = new Database();

        switch (event.httpMethod) {
            case "GET":
                response = await getOrders(event, database);
                break;
            case "POST":
                response = await postOrder(event, database);
                break;
            default:
                response = getResponseFor405(event.httpMethod);
                break;
        }
    } catch (e) {
        console.error("Error: ", e);

        response = getErrorResponse((e as Error));
    }

    addCorsHeader(response);
    return response;
}

export {handler}