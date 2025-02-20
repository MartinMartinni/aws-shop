import {StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {AbstractLambdaStepFunctionCaseStack} from "../../AbstractLambdaStepFunctionCaseStack";
import {join} from "path";
import {Effect, PolicyStatement} from "aws-cdk-lib/aws-iam";
import {ITable} from "aws-cdk-lib/aws-dynamodb";
import {getSuffixFromStack} from "../../../utils/Utils";

export interface WarehouseStepFunctionCaseStackProps extends StackProps {
    productTable: ITable,
    productSoldTable: ITable
}

export class WarehouseStepFunctionCaseStack extends AbstractLambdaStepFunctionCaseStack {

    constructor(scope: Construct, id: string, props: WarehouseStepFunctionCaseStackProps) {
        super(scope, id, props);

        const suffix = getSuffixFromStack(this);

        this.lambdaFunction = this.createLambdaFunction(id, {
            functionName: `warehouse-case-${suffix}`,
            entry: (join(process.cwd(), "src", "services", "step-function", "warehouse", "downstream", "handler.ts")),
            environment: {
                TABLE_PRODUCTS_NAME: props.productTable.tableName,
                TABLE_PRODUCTS_SOLD_NAME: props.productSoldTable.tableName,
            }
        });

        this.lambdaInvoke = this.createLambdaInvoke(id, {
            lambdaFunction: this.lambdaFunction
        });

        this.lambdaFunction.addToRolePolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            resources: [
                props.productTable.tableArn,
                props.productSoldTable.tableArn
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