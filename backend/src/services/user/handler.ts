import {APIGatewayProxyEvent, APIGatewayProxyResult, Context} from "aws-lambda";
import {addCorsHeader, getErrorResponse, getResponseFor405} from "../utils/HttpUtils";
import {getUserByEmail} from "./GetUserByEmail";
import {UserDynamoDBRepository} from "../repository/UserDynamoDBRepository";
import {updateUserAmountOfMoney} from "./UpdateUserAmountOfMoney";

const userDynamoDBRepository = new UserDynamoDBRepository();
async function handler(event: APIGatewayProxyEvent, context: Context) : Promise<APIGatewayProxyResult> {

    let response: APIGatewayProxyResult;

    try {
        console.log("event: ", event);
        console.log("Incoming request: " + event.path + " \n" +
            "- queryParameters: " + JSON.stringify(event.queryStringParameters) + "\n" +
            "- body: " + JSON.stringify(event.body));

        switch (event.httpMethod) {
            case "GET":
                response = await getUserByEmail(event, userDynamoDBRepository);
                break;
            case "PATCH":
                response = await updateUserAmountOfMoney(event, userDynamoDBRepository);
                break;
            default:
                response = getResponseFor405(event.httpMethod)

        }
    } catch (e) {
        console.error("Error: ", e);

        response = getErrorResponse((e as Error));
    }

    addCorsHeader(response);
    return response;
}

export {handler}