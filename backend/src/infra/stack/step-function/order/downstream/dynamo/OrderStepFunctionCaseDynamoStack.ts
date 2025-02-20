import {AbstractLambdaStepFunctionCaseStack} from "../../../AbstractLambdaStepFunctionCaseStack";
import {Construct} from "constructs";
import {join} from "path";
import {StackProps} from "aws-cdk-lib";
import {ITable} from "aws-cdk-lib/aws-dynamodb";
import {Effect, PolicyStatement} from "aws-cdk-lib/aws-iam";
import {getSuffixFromStack} from "../../../../utils/Utils";

export interface OrderStepFunctionCaseDynamoStackProps extends StackProps {
    userTable: ITable,
    productTable: ITable,
    orderTable: ITable
}

export class OrderStepFunctionCaseDynamoStack extends AbstractLambdaStepFunctionCaseStack {
    constructor(scope: Construct, id: string, props: OrderStepFunctionCaseDynamoStackProps) {
        super(scope, id, props);

        let suffix = getSuffixFromStack(this);

        this.lambdaFunction = this.createLambdaFunction(id, {
            functionName: `order-case-dynamo-${suffix}`,
            entry: (join(process.cwd(), "src", "services", "step-function", "order", "downstream", "place-order", "dynamo", "handler.ts")),
            environment: {
                TABLE_ORDERS_NAME: props.orderTable.tableName
            },
        });
        this.lambdaInvoke = this.createLambdaInvoke(id, {
            lambdaFunction: this.lambdaFunction
        });

        this.lambdaFunction.addToRolePolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            resources: [
                props.userTable.tableArn,
                props.productTable.tableArn,
                props.orderTable.tableArn
            ],
            actions: [
                "dynamodb:Scan",
                "dynamodb:PutItem",
                "dynamodb:GetItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:BatchGetItem"
            ]
        }));
    }
}