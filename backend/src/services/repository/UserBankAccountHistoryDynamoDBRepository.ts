import {AbstractDynamoDBRepository} from "./AbstractDynamoDBRepository";
import {UserBankAccountHistoryEntity} from "../entity/no-sql/Entities";
import {ScanCommand} from "@aws-sdk/client-dynamodb";
import {unmarshall} from "@aws-sdk/util-dynamodb";
export class UserBankAccountHistoryDynamoDBRepository extends AbstractDynamoDBRepository<UserBankAccountHistoryEntity> {
    constructor() {
        super(process.env.TABLE_USERS_BANK_ACCOUNT_HISTORY_NAME!);
    }
    public async findAllByUserId(userId: string) {
        const queryParams = {
            TableName: this.tableName,
            FilterExpression: "userId = :userId",
            ExpressionAttributeValues: {
                ":userId": {
                    S: `${userId}`
                },
            }
        };

        const queryResults = await this.ddbClient.send(new ScanCommand(queryParams))
        return queryResults.Items ? queryResults.Items.map(item => unmarshall(item) as UserBankAccountHistoryEntity) : [];
    }
}