import {AbstractDynamoDBRepository} from "./AbstractDynamoDBRepository";
import {OrderEntity} from "../entity/no-sql/Entities";
import {
    ScanCommand,
    PutItemCommand,
    UpdateItemCommand
} from "@aws-sdk/client-dynamodb";
import {unmarshall, marshall} from "@aws-sdk/util-dynamodb";
import { getResponseFor500 } from "../utils/HttpUtils";

export class OrderDynamoDBRepository extends AbstractDynamoDBRepository<OrderEntity> {

    constructor() {
        super(process.env.TABLE_ORDERS_NAME!);
    }

    async save(val: OrderEntity) {
        if (!val.id) {
            val.id = await this.nextId();
        }

        val.createdAt = new Date().toISOString();
        const itemToSave = marshall(val);
        console.log("value to save:", itemToSave);

        return await this.ddbClient.send(new PutItemCommand({
            TableName: this.tableName,
            Item: marshall(val)
        }));
    }

    async saveWithResponseObject(val: OrderEntity) {
        const response = await this.save(val);

        if (response?.$metadata?.httpStatusCode !== 200) {
            return getResponseFor500(new Error(JSON.stringify(response)));
        }

        return await this.findById(val.id);
    }

    async nextId(): Promise<string> {
        console.log("process.env.TABLE_ORDER_COUNTER_NAME: ", process.env.TABLE_ORDER_COUNTER_NAME);

        const result = await this.ddbClient.send(new UpdateItemCommand({
            TableName: process.env.TABLE_ORDER_COUNTER_NAME,
            Key: { id: { N: "1" } },
            UpdateExpression: "SET counter_value = if_not_exists(counter_value, :start) + :inc",
            ExpressionAttributeValues: {
            ":inc": { N: "1" },
            ":start": { N: "1" },
            },
            ReturnValues: "UPDATED_NEW"
        }));

        return result.Attributes?.counter_value?.N!;
    }

    async findAllBy(filterAttributes: {
        AND : {[key: string]: any},
        IN : {[key: string]: any[]}
    }): Promise<OrderEntity[]> {

        console.log("filterAttributes: ", filterAttributes)
        
        const expressionAND = this.buildFilterExpressionPartsAND(filterAttributes?.AND || {});
        const expressionIN = this.buildFilterExpressionPartsIN(filterAttributes?.IN || {});

        console.log("expressionAND: ", expressionAND);
        console.log("expressionIN: ", expressionIN);

        const filterExpressionAND = `${expressionAND?.filterExpressionParts.join(" AND ")}`;
        const filterExpressionIN = `${expressionIN?.filterExpressionParts.join(" AND ")}`;
        const filterExpression = [filterExpressionAND, filterExpressionIN]
            .filter(v => Object.keys(v || {}).length !== 0)
            .join(" AND ");

        const expressionAttributeNames = {
            ...expressionAND.expressionAttributeNames,
            ...expressionIN.expressionAttributeNames
        };
        const expressionAttributeValues = {
            ...expressionAND.expressionAttributeValues,
            ...expressionIN.expressionAttributeValues
        }
        console.log("filterExpression: ", filterExpression);
        console.log("expressionAttributeNames: ", expressionAttributeNames);
        console.log("expressionAttributeValues: ", expressionAttributeValues);
        const query = {
            TableName: this.tableName,
            FilterExpression: filterExpression,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues
        };

        console.log("query: ", query);

        const items = await this.ddbClient.send(new ScanCommand(query));

        return items.Items ? items.Items.map(item => unmarshall(item) as OrderEntity) : [];
    }

    async findOneBy(filterAttributes: {
        AND : {[key: string]: any},
        IN : {[key: string]: any[]}
    }) {
        const orderEntities = await this.findAllBy(filterAttributes) as OrderEntity[];
        return orderEntities.length == 0 ? null : orderEntities[0];
    }

    buildFilterExpressionPartsAND(filterAttributes: {[key: string]: any}): ExpressionObject {
        const filterExpressionParts = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};

        for (const attributeName in filterAttributes) {
            if (filterAttributes.hasOwnProperty(attributeName)) {
                const attributeNamePlaceholder = `#${attributeName}`;
                const attributeValuePlaceholder = `:${attributeName}`;

                filterExpressionParts.push(`${attributeNamePlaceholder} = ${attributeValuePlaceholder}`);

                // @ts-ignore
                expressionAttributeNames[attributeNamePlaceholder] = attributeName;

                const attributeValue = filterAttributes[attributeName];

                // @ts-ignore
                expressionAttributeValues[attributeValuePlaceholder] = {
                    [typeof attributeValue === "number" ? "N" : "S"]: `${filterAttributes[attributeName]}`,
                };
            }
        }

        return {
            filterExpressionParts,
            expressionAttributeNames,
            expressionAttributeValues
        };
    }

    buildFilterExpressionPartsIN(filterAttributes: {[key: string]: any[]}): ExpressionObject {
        const filterExpressionParts = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues: {[key: string]: any} = {};

        for (const attributeName in filterAttributes) {
            if (filterAttributes.hasOwnProperty(attributeName)) {
                const attributeNamePlaceholder = `#${attributeName}`;
                const attributeValuePlaceholder = filterAttributes[attributeName].map((val: any) => `:${val}`);

                filterExpressionParts.push(`${attributeNamePlaceholder} IN (${attributeValuePlaceholder.join(" , ")})`);

                // @ts-ignore
                expressionAttributeNames[attributeNamePlaceholder] = attributeName;

                const attributeValue = filterAttributes[attributeName];

                // @ts-ignore
                filterAttributes[attributeName].map((val: any) => {
                    const v = `:${val}`;
                    return expressionAttributeValues[v] = {
                        [typeof attributeValue === "number" ? "N" : "S"]: `${val}`,
                    };
                })
            }
        }

        return {
            filterExpressionParts,
            expressionAttributeNames,
            expressionAttributeValues
        };
    }
}

export interface ExpressionObject {
    filterExpressionParts: string[],
    expressionAttributeNames: {[key: string]: any},
    expressionAttributeValues: {[key: string]: any}
}