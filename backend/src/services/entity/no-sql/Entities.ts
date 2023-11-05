import {DynamoDBEntity} from "../../repository/DynamoDBEntity";
import {TransferType} from "../../model/Models";

export interface ConnectionEntity extends DynamoDBEntity {
    executionName: string,
    connectionId: string,
    endpoint: string
}

export interface ShipmentEntity extends DynamoDBEntity {
    orderId: number
    country: string
    city: string
    postCode: string
    street: string
    houseNumber: string
    localNumber: string
}

export interface UserBankAccountHistoryEntity extends DynamoDBEntity {
    userId: string,
    amountOfMoney: number
    transferType: TransferType
}

export interface ProductSoldEntity extends DynamoDBEntity {
    orderId: number,
    productId: string,
    quantity: number
}

export interface ProductEntity extends DynamoDBEntity {
    name: string,
    img: string,
    price: number,
    quantity: number
}

export enum UserRole {
    ADMIN = "ADMIN",
    USER = "USER"
}

export interface UserEntity extends DynamoDBEntity {
    sub: string,
    email: string,
    emailVerified: boolean,
    name: string,
    amountOfMoney: number
    role: UserRole
}