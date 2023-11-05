import {AbstractDynamoDBRepository} from "./AbstractDynamoDBRepository";
import {ProductEntity} from "../entity/no-sql/Entities";

export class ProductDynamoDBRepository extends AbstractDynamoDBRepository<ProductEntity> {

    constructor() {
        super(process.env.TABLE_PRODUCTS_NAME!);
    }
}