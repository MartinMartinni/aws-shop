import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import {ProductDynamoDBRepository} from "../repository/ProductDynamoDBRepository";
import {RequiredFieldRequestValidationError, NotFoundError} from "../exception/Exceptions";
import {getResponseFor} from "../utils/HttpUtils";

export async function getProducts(event: APIGatewayProxyEvent, repository:  ProductDynamoDBRepository): Promise<APIGatewayProxyResult> {

    const queryStringParameters = event.queryStringParameters;
    if (queryStringParameters) {
        if ("id" in queryStringParameters) {
            const id = queryStringParameters["id"]!;

            const item = await repository.findById(id);
            if (item) {
                return {
                    statusCode: 200,
                    body: JSON.stringify(item)
                }
            }

            throw new NotFoundError("Product", [{
                name: "id",
                value: `${id}`
            }]);
        } else if ("ids" in queryStringParameters) {
            const idsString = queryStringParameters["ids"] || "";
            const ids = idsString.split(",");

            const items = await repository.findByIds(ids);
            return getResponseFor(200, items);
        }

        throw new RequiredFieldRequestValidationError(["id", "ids"], []);
    }

    const items = await repository.findAll();

    return getResponseFor(200, items);
}