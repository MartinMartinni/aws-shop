import {Column} from "typeorm";

export class Address {

    @Column("varchar")
    country: string;

    @Column("varchar")
    city: string;

    @Column("varchar")
    postCode: string;

    @Column("varchar")
    street: string;

    @Column("varchar")
    houseNumber: string;

    @Column("varchar")
    localNumber: string;
}