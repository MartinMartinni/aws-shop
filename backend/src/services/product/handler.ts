import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import {postProduct} from "./PostProduct";
import {getProducts} from "./GetProducts";
import {updateProduct} from "./UpdateProduct";
import {deleteProduct} from "./DeleteProduct";
import {ProductDynamoDBRepository} from "../repository/ProductDynamoDBRepository";
import {
    addCorsHeader,
    getResponseFor405,
    getErrorResponse
} from "../utils/HttpUtils";

const repository = new ProductDynamoDBRepository();

async function handler(event: APIGatewayProxyEvent, context: Context) : Promise<APIGatewayProxyResult> {

    console.log("Incoming request: " + event.path + " \n" +
        "- queryParameters: " + JSON.stringify(event.queryStringParameters) + "\n" +
        "- body: " + JSON.stringify(event.body));

    let response: APIGatewayProxyResult;

    try {
        switch (event.httpMethod) {
            case "GET":
                response = await getProducts(event, repository);
                break;
            case "POST":
                response = await postProduct(event, repository);
                break;
            case "PUT":
                response = await updateProduct(event, repository);
                break;
            case "DELETE":
                response = await deleteProduct(event, repository);
                break;
            default:
                response = getResponseFor405(event.httpMethod);
                break;
        }

    } catch (e) {
        console.error("Error: ", e);

        response = getErrorResponse((e as Error));
    }

    addCorsHeader(response);
    return response;
}

export {handler};