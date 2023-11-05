import {AddressEntry, OrderEntry, OrderItemEntry, PlaceOrderEntry, UserCreditBankAccountEntry} from "../model/Models";
import {RequestErrorField, RequiredFieldRequestValidationError, RequestValidationError} from "../exception/Exceptions";
import {ProductEntity} from "../entity/no-sql/Entities";

export function validateAsProductsEntry(val: ProductEntity) {
    const missingFields = [] as RequestErrorField[];
    if (!val.name) {
        missingFields.push({
            name: "name",
            path: "name"
        });
    }
    if (!val.img) {
        missingFields.push({
            name: "img",
            path: "img"
        });
    }
    if (!val.price) {
        missingFields.push({
            name: "price",
            path: "price"
        });
    }
    if (!val.quantity) {
        missingFields.push({
            name: "quantity",
            path: "quantity"
        });
    }

    if (missingFields.length != 0) {
        throw new RequiredFieldRequestValidationError( [], missingFields);
    }
}

export function validateAsOrdersEntry(val: OrderEntry) {
    let missingFields = [] as RequestErrorField[];
    if (!val.userId) {
        missingFields.push({
            name: "userId",
            path: "userId"
        });
    }
    if (!val.orderStatus) {
        missingFields.push({
            name: "orderStatus",
            path: "orderStatus"
        });
    }
    if (!val.price) {
        missingFields.push({
            name: "price",
            path: "price"
        });
    }
    const errorFields = validateAsAddressEntry(val.address);
    missingFields = missingFields.concat(errorFields);

    if (!val.items || val.items.length == 0) {
        missingFields.push({
            name: "items",
            path: "items"
        });
    } else {
        const items = val.items as OrderItemEntry[];
        items.forEach((item, i) => {
            if (!item.productId) {
                missingFields.push({
                    name: "productId",
                    path: `items[${i}].productId`
                });
            }
            if (!item.quantity) {
                missingFields.push({
                    name: "quantity",
                    path: `items[${i}].quantity`
                });
            }
            if (!item.price) {
                missingFields.push({
                    name: "price",
                    path: `items[${i}].price`
                });
            }
            if (!item.subTotal) {
                missingFields.push({
                    name: "subTotal",
                    path: `items[${i}].subTotal`
                });
            }
        })
    }

    console.error("missingFields: ", missingFields);

    if (missingFields.length != 0) {
        throw new RequiredFieldRequestValidationError([], missingFields);
    }
}

export function validateAsAddressEntry(address: AddressEntry) : RequestErrorField[] {
    const requiredFields = Object.keys({
        country: "",
        city: "",
        postCode: "",
        street: "",
        houseNumber: "",
        localNumber: ""
    } as AddressEntry) as (keyof AddressEntry)[];

    return requiredFields
        .filter((field) => !address || !address[field])
        .map((field) => ({
            name: field,
            path: `address.${field}`
        }));
}

export function validateAsPlaceOrderEntry(val: PlaceOrderEntry) {
    const missingFields = [] as RequestErrorField[];
    if (!val.orderId) {
        missingFields.push({
            name: "orderId",
            path: "orderId"
        })
    }
    if (!val.userId) {
        missingFields.push({
            name: "userId",
            path: "userId"
        })
    }

    if (missingFields.length != 0) {
        throw new RequiredFieldRequestValidationError([], missingFields);
    }
}

export function validateAsUserCreditBankAccountEntry(val: UserCreditBankAccountEntry) {
    if (!val.amountOfMoney) {
        throw new RequiredFieldRequestValidationError([], [{
            name: "amountOfMoney",
            path: "amountOfMoney"
        }]);
    }

    if (val.amountOfMoney == 0) {
        throw new RequestValidationError("Cannot deposit/Withdraw 0", [], [{
            name: "amountOfMoney",
            path: "amountOfMoney"
        }]);
    }
}