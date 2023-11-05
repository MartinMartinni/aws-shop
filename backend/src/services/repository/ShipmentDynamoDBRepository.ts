import {AbstractDynamoDBRepository} from "./AbstractDynamoDBRepository";
import {ShipmentEntity} from "../entity/no-sql/Entities";

export class ShipmentDynamoDBRepository extends AbstractDynamoDBRepository<ShipmentEntity> {

    constructor() {
        super(process.env.TABLE_SHIPMENTS_NAME!);
    }
}