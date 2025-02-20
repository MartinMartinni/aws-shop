import {RemovalPolicy, Duration, StackProps} from "aws-cdk-lib";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import {Construct} from "constructs";
import {Runtime, Tracing} from "aws-cdk-lib/aws-lambda";
import {join} from "path";
import {AttributeType, BillingMode, ITable, Table} from "aws-cdk-lib/aws-dynamodb";
import {Effect, ManagedPolicy, PolicyStatement} from "aws-cdk-lib/aws-iam";
import {LambdaIntegration} from "aws-cdk-lib/aws-apigateway";
import {getSuffixFromStack} from "../utils/Utils";
import {AbstractOrdeStack} from "./AbstractOrdeStack";

export class OrderLambdaDynamoStack extends AbstractOrdeStack {

    public readonly orderTable: ITable;
    public readonly orderCounterTable: ITable;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props || {});

        const suffix = getSuffixFromStack(this);
        
        this.orderTable = new Table(this, "OrderTable", {
            partitionKey: {
                name: "id",
                type: AttributeType.STRING
            },
            tableName: `order-${suffix}`,
            removalPolicy: RemovalPolicy.DESTROY
        });

        this.orderCounterTable = new Table(this, "OrderCounterTable", {
            partitionKey: {
                name: "id",
                type: AttributeType.NUMBER,
            },
            tableName: `order-counter-${suffix}`,
            removalPolicy: RemovalPolicy.DESTROY,
            billingMode: BillingMode.PAY_PER_REQUEST
        });

        const ordersLambda = new NodejsFunction(this, "OrderLambdaDynamo", {
            functionName: `order-${suffix}`,
            runtime: Runtime.NODEJS_18_X,
            handler: "handler",
            entry: (join(process.cwd(), "src", "services" , "order", "dynamo", "handler.ts")),
            environment: {
                TABLE_ORDERS_NAME: this.orderTable.tableName,
                TABLE_ORDER_COUNTER_NAME: this.orderCounterTable.tableName
            },
            tracing: Tracing.ACTIVE,
            timeout: Duration.minutes(1),
            // allowPublicSubnet: true
        });

        ordersLambda.role?.addManagedPolicy(
            ManagedPolicy.fromAwsManagedPolicyName(
                "service-role/AWSLambdaBasicExecutionRole",
            ),
        );

        ordersLambda.addToRolePolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            resources: [
                this.orderTable.tableArn,
                this.orderCounterTable.tableArn
            ],
            actions: [
                "dynamodb:Scan",
                "dynamodb:PutItem",
                "dynamodb:GetItem",
                "dynamodb:UpdateItem"
            ]
        }));

        this.orderLambdaIntegration = new LambdaIntegration(ordersLambda);
    }
}