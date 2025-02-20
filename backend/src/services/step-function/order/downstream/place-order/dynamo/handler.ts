import {APIGatewayProxyResult, Context} from "aws-lambda";
import {postPlaceOrder} from "./PostPlaceOrder";
import {addCorsHeader} from "../../../../../utils/HttpUtils";
import {GeneralException} from "../../../../../exception/Exceptions";
import {APIGatewayProxyCustomEvent} from "../../../../../model/HttpModels";
import {OrderDynamoDBRepository} from "./../../../../../repository/OrderDynamoDBRepository";

const repository = new OrderDynamoDBRepository();
export async function handler(event: APIGatewayProxyCustomEvent, context: Context) : Promise<APIGatewayProxyResult> {

    let response: APIGatewayProxyResult;
    try {
        console.log("event: ", event);
        console.log("Incoming request: " + event.path + " \n" +
            "- queryParameters: " + JSON.stringify(event.queryStringParameters) + "\n" +
            "- body: " + JSON.stringify(event.body));

        response = await postPlaceOrder(event, repository);
        addCorsHeader(response);
        return response;
    } catch (e) {
        throw new GeneralException((e as Error), {
            orderId: event.workflowProps.orderId,
            executionName: event.workflowProps.executionName
        });
    }
}