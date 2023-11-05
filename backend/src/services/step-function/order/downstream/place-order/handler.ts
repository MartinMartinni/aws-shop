import {APIGatewayProxyResult, Context} from "aws-lambda";
import {postPlaceOrder} from "./PostPlaceOrder";
import {Database} from "../../../../component/Database";
import {addCorsHeader} from "../../../../utils/HttpUtils";
import {GeneralException} from "../../../../exception/Exceptions";
import {APIGatewayProxyCustomEvent} from "../../../../model/HttpModels";

async function handler(event: APIGatewayProxyCustomEvent, context: Context) : Promise<APIGatewayProxyResult> {

    let response: APIGatewayProxyResult;
    try {
        console.log("event: ", event);
        console.log("Incoming request: " + event.path + " \n" +
            "- queryParameters: " + JSON.stringify(event.queryStringParameters) + "\n" +
            "- body: " + JSON.stringify(event.body));

        const database = new Database();

        response = await postPlaceOrder(event, database);
        addCorsHeader(response);
        return response;
    } catch (e) {
        throw new GeneralException((e as Error), {
            orderId: event.workflowProps.orderId,
            executionName: event.workflowProps.executionName
        });
    }
}

export {handler}