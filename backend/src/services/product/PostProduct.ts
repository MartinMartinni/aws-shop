import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';
import {parseJSON} from "../utils/Utils";
import {validateAsProductsEntry} from "../validators/Validators";
import {ProductEntity} from "../entity/no-sql/Entities";
import {ProductDynamoDBRepository} from "../repository/ProductDynamoDBRepository";
import {getResponseFor} from "../utils/HttpUtils";

export async function postProduct(event: APIGatewayProxyEvent, repository:  ProductDynamoDBRepository): Promise<APIGatewayProxyResult> {

    const body = event.body;

    const product = parseJSON(body || "{}") as ProductEntity;
    validateAsProductsEntry(product);

    const result = repository.save(product);

    return getResponseFor(201, result);
}