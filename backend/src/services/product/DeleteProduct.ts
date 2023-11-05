import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {ProductDynamoDBRepository} from "../repository/ProductDynamoDBRepository";
import {RequiredFieldRequestValidationError} from "../exception/Exceptions";
import {getResponseFor} from "../utils/HttpUtils";

export async function deleteProduct(event: APIGatewayProxyEvent, repository:  ProductDynamoDBRepository): Promise<APIGatewayProxyResult> {

    if (!event.queryStringParameters || !event.queryStringParameters["id"]) {
        throw new RequiredFieldRequestValidationError(["id"], []);
    }

    await repository.deleteById(event.queryStringParameters["id"]);

    return getResponseFor(204, {message: ""});
}