import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";
import {ConnectionDynamoDBRepository} from "../repository/ConnectionDynamoDBRepository";
import {ConnectionEntity} from "../entity/no-sql/Entities";
import {addCorsHeader, getErrorResponse, getResponseFor} from "../utils/HttpUtils";
import {RequiredFieldRequestValidationError} from "../exception/Exceptions";

const connectionDynamoDBRepository = new ConnectionDynamoDBRepository()

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {

    let response: APIGatewayProxyResult;

    try {

        console.log("event: ", event);

        const body = JSON.parse(event.body || "{}") as ConnectionEntity;

        if (!body.executionName) {
            throw new RequiredFieldRequestValidationError([], [{
                name: "executionName",
                path: "executionName"
            }])
        }

        const connection = {
            id: "",
            connectionId: event.requestContext.connectionId as string,
            executionName: body.executionName,
            endpoint: event.requestContext.domainName + "/" + event.requestContext.stage
        } as ConnectionEntity;

        console.log("Connection to save: ", connection);

        await connectionDynamoDBRepository.save(connection)

        response = getResponseFor(200, {
            message: "ONMESSAGE_SAVE_CONNECTION"
        });
    } catch (e) {
        console.error("Error: ", e);

        response = getErrorResponse((e as Error));
    }

    addCorsHeader(response);
    return response;
}
