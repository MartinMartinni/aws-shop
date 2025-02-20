import {StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {AbstractLambdaStepFunctionCaseStack} from "../AbstractLambdaStepFunctionCaseStack";
import {LambdaInvoke} from "aws-cdk-lib/aws-stepfunctions-tasks/lib/lambda/invoke";
import {join} from "path";
import {ITable} from "aws-cdk-lib/aws-dynamodb";
import {Effect, PolicyStatement} from "aws-cdk-lib/aws-iam";
import {getSuffixFromStack} from "../../utils/Utils";

export interface PaymentStepFunctionCaseStackProps extends StackProps {
    userTable: ITable
    userBankAccountHistoryTable: ITable
}

export class PaymentStepFunctionCaseStack extends AbstractLambdaStepFunctionCaseStack {

    public readonly lambdaInvoke: LambdaInvoke;

    constructor(scope: Construct, id: string, props: PaymentStepFunctionCaseStackProps) {
        super(scope, id, props);

        const suffix = getSuffixFromStack(this);

        this.lambdaFunction = this.createLambdaFunction(id, {
            functionName: `payment-case-${suffix}`,
            entry: (join(process.cwd(), "src", "services", "step-function", "payment", "handler.ts")),
            environment: {
                TABLE_USERS_NAME: props.userTable.tableName,
                TABLE_USERS_BANK_ACCOUNT_HISTORY_NAME: props.userBankAccountHistoryTable.tableName
            }
        });
        this.lambdaInvoke = this.createLambdaInvoke(id, {
            lambdaFunction: this.lambdaFunction
        });

        this.lambdaFunction.addToRolePolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            resources: [
                props.userTable.tableArn,
                props.userBankAccountHistoryTable.tableArn
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