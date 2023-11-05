import {AbstractDynamoDBRepository} from "./AbstractDynamoDBRepository";
import {ProductSoldEntity} from "../entity/no-sql/Entities";
import {BatchWriteItemCommand, ScanCommand} from "@aws-sdk/client-dynamodb";

export class ProductsSoldDBRepository extends AbstractDynamoDBRepository<ProductSoldEntity> {

    constructor() {
        super(process.env.TABLE_PRODUCTS_SOLD_NAME!);
    }

    async deleteAllByOrderId(orderId: number) {
        const queryParams = {
            TableName: this.tableName,
            FilterExpression: "orderId = :orderId",
            ExpressionAttributeValues: {
                ":orderId": {
                    N: `${orderId}`
                },
            }
        };

        const queryResults = await this.ddbClient.send(new ScanCommand(queryParams))
        const items = queryResults.Items ? queryResults.Items : [];

        const batchCalls = this.chunks(items).map(async (chunk) => {
            const deleteRequests = chunk.map(item => {
                return {
                    DeleteRequest : {
                        Key : {
                            id : item.id
                        }
                    }
                }
            })

            const batchWriteParams = {
                RequestItems : {
                    [this.tableName] : deleteRequests
                }
            }
            await this.ddbClient.send(new BatchWriteItemCommand(batchWriteParams))
        })

        await Promise.all(batchCalls);
    }
}