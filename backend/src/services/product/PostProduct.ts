import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';
import {parseJSON} from "../utils/Utils";
import {validateAsProductsEntry} from "../validators/Validators";
import {ProductEntity} from "../entity/no-sql/Entities";
import {ProductDynamoDBRepository} from "../repository/ProductDynamoDBRepository";
import {getResponseFor} from "../utils/HttpUtils";

export async function postProduct(event: APIGatewayProxyEvent, repository:  ProductDynamoDBRepository): Promise<APIGatewayProxyResult> {

    const body = event.body;

    const productObj = parseJSON(body || "{}");
    if (Array.isArray(productObj)) {
        productObj as ProductEntity[];
        productObj.forEach((pr: ProductEntity) => validateAsProductsEntry(pr));
        const result = await repository.saveAll(productObj);
        return getResponseFor(201, result);
    }

    productObj as ProductEntity;
    validateAsProductsEntry(productObj);

    const result = repository.save(productObj);
    return getResponseFor(201, result);
}