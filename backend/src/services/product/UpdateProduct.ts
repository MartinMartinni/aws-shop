import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import {parseJSON} from "../utils/Utils";
import {ProductDynamoDBRepository} from "../repository/ProductDynamoDBRepository";
import {ProductEntity} from "../entity/no-sql/Entities";
import {RequiredFieldRequestValidationError} from "../exception/Exceptions";
import {validateAsProductsEntry} from "../validators/Validators";
import {getResponseFor} from "../utils/HttpUtils";

export async function updateProduct(event: APIGatewayProxyEvent, repository:  ProductDynamoDBRepository): Promise<APIGatewayProxyResult> {

    const body = event.body;

    if (!event.queryStringParameters || !("id" in event.queryStringParameters)) {
        throw new RequiredFieldRequestValidationError(["id"], []);
    }

    const id = event.queryStringParameters["id"]!;
    const product = parseJSON(body || "{}") as ProductEntity;
    validateAsProductsEntry(product)
    const result = await repository.updateFields(id, {
        name: product.name,
        img: product.img,
        price: product.price,
        quantity: product.quantity
    });

    return getResponseFor(200, result);
}