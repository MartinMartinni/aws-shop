import {AbstractDynamoDBRepository} from "./AbstractDynamoDBRepository";
import {UserEntity} from "../entity/no-sql/Entities";
import {ScanCommand} from "@aws-sdk/client-dynamodb";
import {unmarshall} from "@aws-sdk/util-dynamodb";

export class UserDynamoDBRepository extends AbstractDynamoDBRepository<UserEntity> {

    constructor() {
        super(process.env.TABLE_USERS_NAME!);
    }

    public async findByEmail(email: string) {
        const queryParams = {
            TableName: this.tableName,
            FilterExpression: "email = :email",
            ExpressionAttributeValues: {
                ":email": {
                    S: email
                },
            }
        };

        const queryResults = await this.ddbClient.send(new ScanCommand(queryParams))
        return queryResults.Items ? queryResults.Items.map(user => unmarshall(user) as UserEntity)[0] : undefined;
    }
}