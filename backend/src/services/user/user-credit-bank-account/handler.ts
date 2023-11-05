import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";
import {UserBankAccountHistoryDynamoDBRepository} from "../../repository/UserBankAccountHistoryDynamoDBRepository";
import {addCorsHeader, getErrorResponse, getResponseFor, getResponseFor405} from "../../utils/HttpUtils";
import {RequiredFieldRequestValidationError} from "../../exception/Exceptions";

const repository = new UserBankAccountHistoryDynamoDBRepository();

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {

    let response: APIGatewayProxyResult
    try {
        if (event.httpMethod !== "GET") {
            response = getResponseFor405(event.httpMethod);

            addCorsHeader(response);
            return response;
        }

        if (!event.queryStringParameters || !event.queryStringParameters["userId"]) {
            throw new RequiredFieldRequestValidationError(["userId"], []);
        }

        const userBankAccountHistoryEntities = await repository.findAllByUserId(event.queryStringParameters["userId"]);

        response = getResponseFor(200, userBankAccountHistoryEntities);
    } catch (e) {
        console.error("Error: ", e);

        response = getErrorResponse((e as Error));
    }

    addCorsHeader(response);
    return response
}