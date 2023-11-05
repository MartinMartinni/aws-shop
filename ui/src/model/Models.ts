export interface Product {
    id: string
    createdAt: string
    name: string,
    img: string,
    price: number,
    quantity: number
}
export enum OrderStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILURE = "FAILURE"
}
export interface Order {
    id: number;
    userId: string;
    orderStatus: OrderStatus;
    price: number;
    items: OrderItems[];
    address: Address;
}

export interface OrderItems {
    id: number;
    productId: string;
    productName: string;
    productImg: string;
    quantity: number;
    price: number;
    subTotal: number;
}

export interface Address {
    country: string;
    city: string;
    postCode: string;
    street: string;
    houseNumber: string;
    localNumber: string;
}

export enum TransferType {
    DEBIT = "DEBIT",
    CREDIT = "CREDIT"
}

export interface UserBankAccountHistory {
    id: string,
    userId: string,
    amountOfMoney: number
    transferType: TransferType
}
export enum UserRole {
    ADMIN = "ADMIN",
    USER = "USER"
}

export interface User {
    id: string;
    sub: string;
    name: string;
    email: string;
    amountOfMoney: number;
    password: string;
    role: UserRole
}

export interface RequestErrorField {
    name: string;
    path: string;
}