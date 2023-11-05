import {RemovalPolicy, Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {AttributeType, Table} from "aws-cdk-lib/aws-dynamodb";
import {getSuffixFromStack} from "../utils/Utils";
export class ProductDataStack extends Stack {

    public readonly productTable: Table;
    public readonly productSoldTable: Table;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const suffix = getSuffixFromStack(this);

        this.productTable = new Table(this, "ProductTable", {
            partitionKey: {
                name: "id",
                type: AttributeType.STRING
            },
            tableName: `product-${suffix}`,
            removalPolicy: RemovalPolicy.DESTROY
        });

        this.productSoldTable = new Table(this, "ProductSoldTable", {
            partitionKey: {
                name: "id",
                type: AttributeType.STRING
            },
            tableName: `product-sold-${suffix}`,
            removalPolicy: RemovalPolicy.DESTROY
        });
    }

}