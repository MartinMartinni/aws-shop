import {Entity, PrimaryGeneratedColumn, Column, OneToMany} from "typeorm";
import {OrderItems} from "./OrderItems";
import {Address} from "./Address";

export enum OrderStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILURE = "FAILURE",
}

@Entity()
export class Orders {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: "varchar"})
    userId: string;

    @Column({
        type: "enum",
        enum: OrderStatus,
        default: OrderStatus.PENDING,
    })
    orderStatus: OrderStatus;

    @Column("decimal", { precision: 10, scale: 2 })
    price: number;

    @OneToMany(() => OrderItems,
            orderItems => orderItems.order,
        {
            cascade: true,
            eager: true
        })
    items: OrderItems[];

    @Column(() => Address)
    address: Address;
}
