import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";
import {ProductsUnavailable} from "../../../model/Models";
import {ProductEntity, ProductSoldEntity} from "../../../entity/no-sql/Entities";
import {ProductDynamoDBRepository} from "../../../repository/ProductDynamoDBRepository";
import {Orders} from "../../../entity/sql/Orders";
import {ProductsSoldDBRepository} from "../../../repository/ProductsSoldDBRepository";
import {getResponseFor} from "../../../utils/HttpUtils";
import {parseJSON} from "../../../utils/Utils";
import {GeneralException, ProductsUnavailableError, WrongOrderPriceError} from "../../../exception/Exceptions";
import {APIGatewayProxyCustomEvent} from "../../../model/HttpModels";

const productRepository = new ProductDynamoDBRepository();
const productsSoldDBRepository = new ProductsSoldDBRepository();

export async function handler(event: APIGatewayProxyCustomEvent): Promise<APIGatewayProxyResult> {

    try {
        console.log("event: ", event);

        const body = event.body;
        const parsedBody = parseJSON(body);
        const order = parsedBody.order as Orders;
        const {
            productsUnavailable,
            priceCalculatedFromDB,
            productsToSave
        } = await analyzeOrder(order);

        if (productsUnavailable.length > 0) {
            throw new ProductsUnavailableError(productsUnavailable);
        }

        if (priceCalculatedFromDB != order.price) {
            throw new WrongOrderPriceError(order.price, priceCalculatedFromDB);
        }

        const productSoldToSave = order.items.map(item => {
            return {
                orderId: order.id,
                productId: item.productId,
                quantity: item.quantity
            };
        }) as ProductSoldEntity[];

        await productRepository.saveAll(productsToSave);
        await productsSoldDBRepository.saveAll(productSoldToSave);

        return getResponseFor(parsedBody.statusCode, {
            order,
        }, {
            workflowProps: event.workflowProps
        })
    } catch (e) {
        console.error("Error: ", e);
        throw new GeneralException((e as Error), {
            ...event.workflowProps
        });
    }
}

async function analyzeOrder(order: Orders) : Promise<{
    productsUnavailable: ProductsUnavailable[],
    productsEmptyAlert: string[],
    priceCalculatedFromDB: number,
    productsToSave: ProductEntity[]
}> {
    const productsIds = getProductsIds(order);
    const products = await productRepository.findByIds(productsIds);

    const productsEmptyAlert = [] as string[];
    const productsUnavailable = [] as ProductsUnavailable[];
    let priceCalculatedFromDB = 0;

    const orderItems = order.items;
    const productsToSave = orderItems
        .map(item => {
            return products.filter(product => item.productId === product.id)
                .map(product => {
                    priceCalculatedFromDB += product.price * item.quantity

                    if (product.quantity >= item.quantity) {
                        product.quantity -= item.quantity;
                    } else {
                        productsUnavailable.push({
                            id: product.id,
                            name: product.name
                        });
                    }
                    if (product.quantity == 0)
                        productsEmptyAlert.push(product.id);

                    return product;
                })
        })
        .reduce((accumulator, currentValue) => {
            return currentValue != null ? accumulator.concat(currentValue) : []
        }, []) || [];
    return {
        productsUnavailable,
        productsEmptyAlert,
        priceCalculatedFromDB,
        productsToSave
    };
}

function getProductsIds(order: Orders) {
    return order.items.map(i => i.productId);
}
