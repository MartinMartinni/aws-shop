import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";
import {getResponseFor} from "../utils/HttpUtils";

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {

    console.log("On connection");
    return getResponseFor(200, "CONNECTED")
}
