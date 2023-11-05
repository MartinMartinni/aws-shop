import {ConnectionDynamoDBRepository} from "../repository/ConnectionDynamoDBRepository";
import {APIGatewayProxyResult} from "aws-lambda";
import ApiGatewayManagementApi = require("aws-sdk/clients/apigatewaymanagementapi")
import {NotFoundError} from "../exception/Exceptions";
import {addCorsHeader, getErrorResponse, getResponseFor} from "../utils/HttpUtils";
import {parseJSON} from "../utils/Utils";
import {APIGatewayProxyCustomEvent} from "../model/HttpModels";

const connectionDynamoDBRepository = new ConnectionDynamoDBRepository()
export async function handler(event: APIGatewayProxyCustomEvent): Promise<APIGatewayProxyResult> {

    let response: APIGatewayProxyResult;
    try {
        console.log("event: ", event);

        const body = event.detail?.Message.body;
        const parsedBody = parseJSON(body);
        const connection = await connectionDynamoDBRepository.findByExecutionName(parsedBody.executionName);

        if (!connection) {
            throw new NotFoundError("Connection",[{
                name: "connection",
                value: parsedBody.executionName
            }])
        }

        console.log("connection: ", connection);

        const apiGatewayManagementApi = new ApiGatewayManagementApi({ apiVersion: '2018-11-29', endpoint: connection.endpoint });
        await apiGatewayManagementApi.postToConnection({ ConnectionId: connection.connectionId, Data: body })
            .promise()
            .then(()=> {
                console.log(`Message sent to connection ${connection.connectionId}`);
            })
            .catch((err: any) => {
                console.log(`Error during message delivery: ${JSON.stringify(err)}`);
                if (err.statusCode === 410) {
                    console.log(`Found stale connection, deleting ${connection.connectionId}`);
                    connectionDynamoDBRepository.deleteById(connection.id);
                }
            });

        response = getResponseFor(200, event);
    } catch (e) {
        console.error("Error: ", e);

        response = getErrorResponse((e as Error));
    }

    addCorsHeader(response);
    return response;
}