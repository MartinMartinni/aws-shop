import {OrderItems, Product} from "../model/Models.ts";

export function mapProductToOrderItem(product: Product) : OrderItems {
    return {
        id: 0,
        productId: product.id,
        productName: product.name,
        productImg: product.img,
        quantity: product.quantity,
        price: product.price,
        subTotal: product.quantity * product.price
    }
}