import {Entity, PrimaryGeneratedColumn, Column, ManyToOne} from "typeorm";
import {Orders} from "./Orders";

@Entity()
export class OrderItems {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("varchar")
    productId: string;

    @Column("varchar")
    productName: string;

    @Column("varchar")
    productImg: string;

    @Column("integer")
    quantity: number;

    @Column("decimal", { precision: 10, scale: 2 })
    price: number;

    @Column("decimal", { precision: 10, scale: 2 })
    subTotal: number;

    @ManyToOne(type => Orders, orders => orders.items)
    order: Orders;
}
