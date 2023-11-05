import {AbstractDynamoDBRepository} from "./AbstractDynamoDBRepository";
import {ConnectionEntity} from "../entity/no-sql/Entities";
import {ScanCommand} from "@aws-sdk/client-dynamodb";
import {unmarshall} from "@aws-sdk/util-dynamodb";
export class ConnectionDynamoDBRepository extends AbstractDynamoDBRepository<ConnectionEntity> {

    constructor() {
        super(process.env.TABLE_CONNECTIONS_NAME!);
    }

    async findByExecutionName(executionName: string) {
        const queryParams = {
            TableName: this.tableName,
            FilterExpression: "executionName = :executionName",
            ExpressionAttributeValues: {
                ":executionName": {
                    S: executionName
                },
            }
        };

        const queryResults = await this.ddbClient.send(new ScanCommand(queryParams))
        const items = queryResults.Items ? queryResults.Items : [];
        return items.length > 0 ? unmarshall(items[0]) as ConnectionEntity : undefined;
    }
}