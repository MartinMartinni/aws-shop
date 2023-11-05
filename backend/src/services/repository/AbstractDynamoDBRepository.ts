import {
    DeleteItemCommand,
    DynamoDBClient,
    BatchGetItemCommand,
    GetItemCommand,
    PutItemCommand,
    ScanCommand,
    AttributeValue, UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import {marshall, unmarshall} from "@aws-sdk/util-dynamodb";
import {createRandomId} from "../utils/Utils";
import {DynamoDBEntity} from "./DynamoDBEntity";

export abstract class AbstractDynamoDBRepository<T extends DynamoDBEntity> {

    readonly batchSize: number;
    readonly tableName: string;
    protected readonly ddbClient: DynamoDBClient;

    protected constructor(tableName: string) {
        this.batchSize = 25;
        this.tableName = tableName;
        this.ddbClient = new DynamoDBClient();
    }

    async save(val: T) {
        if (!val.id) {
            val.id = createRandomId();
        }

        val.createdAt = new Date().toISOString();
        return await this.ddbClient.send(new PutItemCommand({
            TableName: this.tableName,
            Item: marshall(val)
        }));
    }

    async saveAll(values: T[]) {
        const result = values.map(async value => this.save(value));
        return await Promise.all(result);
    }

    async findById(id: string) : Promise<T | null> {
        const result = await this.ddbClient.send(new GetItemCommand({
            TableName: this.tableName,
            Key: {
                // @ts-ignore
                "id": {
                    S: id
                }
            }
        }));
        return result.Item ? unmarshall(result.Item) as T : null;
    }

    async findAll() {
        const items = await this.ddbClient.send(new ScanCommand({
            TableName: this.tableName,
        }));

        return items.Items ? items.Items.map(item => unmarshall(item) as T) : [];
    }

    async findByIds(ids: string[]) : Promise<T[]> {
        const batchGetParams = {
            RequestItems: {
                [this.tableName]: {
                    Keys: ids.map(id => ({
                        id: { S: id },
                    }))
                },
            },
        };

        const items = await this.ddbClient.send(new BatchGetItemCommand(batchGetParams));
        return items.Responses ? items.Responses[this.tableName].map(item => unmarshall(item) as T) : [];
    }

    async deleteById(id: string) {
        await this.ddbClient.send(new DeleteItemCommand({
            TableName: this.tableName,
            Key: {
                "id": {
                    S: id
                }
            }
        }));
    }

    async updateFields(id: string, updateAttributes: {[key: string]: any}) {
        const updateExpressionParts = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};

        for (const attributeName in updateAttributes) {
            if (updateAttributes.hasOwnProperty(attributeName)) {
                const attributeNamePlaceholder = `#${attributeName}`;
                const attributeValuePlaceholder = `:${attributeName}`;

                updateExpressionParts.push(`${attributeNamePlaceholder} = ${attributeValuePlaceholder}`);
                // @ts-ignore
                expressionAttributeNames[attributeNamePlaceholder] = attributeName;

                const attributeValue = updateAttributes[attributeName];

                // @ts-ignore
                expressionAttributeValues[attributeValuePlaceholder] = {
                    [typeof attributeValue === "number" ? "N" : "S"]: `${updateAttributes[attributeName]}`,
                };
            }
        }

        const updateExpression = `SET ${updateExpressionParts.join(", ")}`;
        return await this.ddbClient.send(new UpdateItemCommand({
            TableName: this.tableName,
            Key: { id: { S: id } },
            UpdateExpression: updateExpression,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: "UPDATED_NEW"
        }));
    }

    chunks(inputArray: Record<string, AttributeValue>[]) : Record<string, AttributeValue>[][] {
        const deleteRequestBatches = [] as Record<string, AttributeValue>[][];
        for (let i = 0; i < inputArray.length; i += this.batchSize) {
            const batchItemIds = inputArray.slice(i, i + this.batchSize);
            deleteRequestBatches.push(batchItemIds);
        }
        return deleteRequestBatches;
    }
}