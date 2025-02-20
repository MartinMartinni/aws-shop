import {RemovalPolicy, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {Effect, PolicyStatement} from "aws-cdk-lib/aws-iam";
import {AttributeType, ITable, Table} from "aws-cdk-lib/aws-dynamodb";
import {join} from "path";
import {getSuffixFromStack} from "../../../../utils/Utils";
import { AbstractOrderFinalizationStepFunctionCaseStack } from "../../../AbstractOrderFinalizationStepFunctionCaseStack";

export interface OrderFinalizationStepFunctionCaseDynamoStackProps extends StackProps {
    orderTable: ITable
}

export class OrderFinalizationStepFunctionCaseDynamoStack extends AbstractOrderFinalizationStepFunctionCaseStack {

    constructor(scope: Construct, id: string, props: OrderFinalizationStepFunctionCaseDynamoStackProps) {
        super(scope, id, props);

        const suffix = getSuffixFromStack(this);

        this.connectionsTable = new Table(this, "ConnectionsTable", {
            partitionKey: {
                name: "id",
                type: AttributeType.STRING
            },
            tableName: `connection-${suffix}`,
            removalPolicy: RemovalPolicy.DESTROY
        });

        this.lambdaFunction = this.createLambdaFunction(id, {
            functionName: `order-finalization-case-dynamo-${suffix}`,
            entry: (join(process.cwd(), "src", "services", "step-function", "order", "downstream", "finalization", "dynamo", "handler.ts")),
            environment: {
                TABLE_CONNECTIONS_NAME: this.connectionsTable.tableName,
                TABLE_ORDERS_NAME: props.orderTable.tableName
            },
        });
        this.lambdaInvoke = this.createLambdaInvoke(id, {
            lambdaFunction: this.lambdaFunction
        });
        this.lambdaFunction.addToRolePolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            resources: [
                this.connectionsTable.tableArn,
                props.orderTable.tableArn
            ],
            actions: [
                "dynamodb:Scan",
                "dynamodb:PutItem"
            ]
        }));
    }
}