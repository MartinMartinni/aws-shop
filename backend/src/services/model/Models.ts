export enum OrderWorkflowType {
    REVERT_WAREHOUSE_SUCCESS = "REVERT_WAREHOUSE_SUCCESS",
    PAYMENT_SUCCESS = "PAYMENT_SUCCESS",
    PAYMENT_ERROR = "PAYMENT_ERROR",
    SHIPMENT_SUCCESS = "SHIPMENT_SUCCESS"
}

export enum WorkflowStatus {
    SUCCESS = "SUCCESS",
    ERROR = "ERROR"
}

export enum TransferType {
    DEBIT = "DEBIT",
    CREDIT = "CREDIT"
}
export interface UserCreditBankAccountEntry {
    amountOfMoney: number
}

export enum OrderStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILURE = "FAILURE",
}

export interface OrderEntry {
    id: number,
    userId: string
    orderStatus: OrderStatus,
    price: number,
    address: AddressEntry;
    items: OrderItemEntry[]
}

export interface AddressEntry {
    country: string;
    city: string;
    postCode: string;
    street: string;
    houseNumber: string;
    localNumber: string;
}

export interface OrderItemEntry {
    id: number,
    productId: string,
    productName: string,
    productImg: string,
    quantity: number,
    price: number,
    subTotal: number,
    orderId: number
}

export interface PlaceOrderEntry {
    orderId: number,
    userId: string
}

export class ProductsUnavailable {
    public readonly id: string
    public readonly name: string
}