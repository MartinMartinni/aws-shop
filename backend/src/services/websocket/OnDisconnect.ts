import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";
import {getResponseFor} from "../utils/HttpUtils";
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {

    console.log("On disconnection");
    return getResponseFor(200, "DISCONNECTED")
}
