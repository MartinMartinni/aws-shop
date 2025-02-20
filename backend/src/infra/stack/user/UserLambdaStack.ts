import {Duration, Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import {Runtime, Tracing} from "aws-cdk-lib/aws-lambda";
import {join} from "path";
import {ITable} from "aws-cdk-lib/aws-dynamodb";
import {Effect, PolicyStatement} from "aws-cdk-lib/aws-iam";
import {getSuffixFromStack} from "../utils/Utils";

export interface UserLambdaStackProps extends StackProps {
    userTable: ITable,
    userCreditBankAccountTable: ITable
}

export class UserLambdaStack extends Stack {
    public readonly lambdaFunction: NodejsFunction;

    constructor(scope: Construct, id: string, props: UserLambdaStackProps) {
        super(scope, id, props);

        const suffix = getSuffixFromStack(this);

        this.lambdaFunction = new NodejsFunction(this, "UserLambda", {
            functionName: `user-${suffix}`,
            runtime: Runtime.NODEJS_18_X,
            handler: "handler",
            entry: (join(process.cwd(), "src", "services", "user", "handler.ts")),
            environment: {
                TABLE_USERS_NAME: props.userTable.tableName,
                TABLE_USERS_BANK_ACCOUNT_HISTORY_NAME: props.userCreditBankAccountTable.tableName
            },
            tracing: Tracing.ACTIVE,
            timeout: Duration.minutes(1)
        });

        this.lambdaFunction.addToRolePolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            resources: [props.userTable.tableArn],
            actions: [
                "dynamodb:Scan",
                "dynamodb:GetItem",
                "dynamodb:UpdateItem"
            ]
        }));

        this.lambdaFunction.addToRolePolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            resources: [props.userCreditBankAccountTable.tableArn],
            actions: [
                "dynamodb:PutItem"
            ]
        }));
    }

}