import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {ProductDynamoDBRepository} from "../repository/ProductDynamoDBRepository";
import {RequiredFieldRequestValidationError} from "../exception/Exceptions";
import {getResponseFor} from "../utils/HttpUtils";

export async function deleteProduct(event: APIGatewayProxyEvent, repository:  ProductDynamoDBRepository): Promise<APIGatewayProxyResult> {

    if (!event.queryStringParameters || !event.queryStringParameters["id"] && !event.queryStringParameters["ids"]) {
        throw new RequiredFieldRequestValidationError(["id", "ids"], []);
    }

    if (event.queryStringParameters["ids"]) {
        const ids = event.queryStringParameters["ids"].split(",") as string[];
        await repository.deleteByIds(ids);
        return getResponseFor(204, {message: ""});
    }

    await repository.deleteById(event.queryStringParameters["id"]!);
    return getResponseFor(204, {message: ""});
}