import {APIGatewayProxyResult} from "aws-lambda";
import {ProductDynamoDBRepository} from "../../../repository/ProductDynamoDBRepository";
import {ProductsSoldDBRepository} from "../../../repository/ProductsSoldDBRepository";
import {Orders} from "../../../entity/sql/Orders";
import {OrderItems} from "../../../entity/sql/OrderItems";
import {ProductEntity} from "../../../entity/no-sql/Entities"
import {parseJSON} from "../../../utils/Utils";
import {GeneralException, UserDoesNotHaveEnoughOfMoney} from "../../../exception/Exceptions";
import {APIGatewayProxyCustomEvent} from "../../../model/HttpModels";

const productRepository = new ProductDynamoDBRepository();
const productsSoldDBRepository = new ProductsSoldDBRepository();

export async function handler(event: APIGatewayProxyCustomEvent): Promise<APIGatewayProxyResult> {

    let parsedBody: any;
    try {
        const body = event.body;

        parsedBody = parseJSON(body);

        const order = parsedBody.order as Orders;

        const productsToSave = await getRevertedProductsQuantities(order);

        console.log("productsToSave: ", productsToSave);

        await productRepository.saveAll(productsToSave);

        await productsSoldDBRepository.deleteAllByOrderId(order.id);

        throw new UserDoesNotHaveEnoughOfMoney();
    } catch (e) {
        throw new GeneralException((e as Error), {
            ...event.workflowProps
        });
    }
}

async function getRevertedProductsQuantities(order: Orders) : Promise<ProductEntity[]> {

    const orderItems = order.items;
    const productsIds = getProductsIds(order);
    const products = await productRepository.findByIds(productsIds);
    return orderItems
        .map((item: OrderItems) => {
            return products.filter(product => item.productId === product.id)
                .map(product => {
                    product.quantity += item.quantity;

                    return product;
                })
        })
        .reduce((accumulator, currentValue) => {
            return currentValue != null ? accumulator.concat(currentValue) : []
        }, []) || [];
}

function getProductsIds(order: Orders) {
    return order.items.map(i => i.productId);
}