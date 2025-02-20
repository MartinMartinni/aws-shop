import {Duration, Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import {Runtime, Tracing, Function} from "aws-cdk-lib/aws-lambda";
import {join} from "path";
import {ITable} from "aws-cdk-lib/aws-dynamodb";
import {Effect, PolicyStatement} from "aws-cdk-lib/aws-iam";
import {getSuffixFromStack} from "../utils/Utils";

export interface UserCreditBankAccountLambdaStackProps extends StackProps {
    userCreditBankAccountTable: ITable
}

export class UserCreditBankAccountLambdaStack extends Stack {
    public readonly lambdaFunction: Function;

    constructor(scope: Construct, id: string, props: UserCreditBankAccountLambdaStackProps) {
        super(scope, id, props);

        const suffix = getSuffixFromStack(this);

        this.lambdaFunction = new NodejsFunction(this, "UserCreditBankAccountHistoryLambda", {
            functionName: `user-credit-bank-account-history-${suffix}`,
            runtime: Runtime.NODEJS_18_X,
            handler: "handler",
            entry: (join(process.cwd(), "src", "services", "user", "user-credit-bank-account", "handler.ts")),
            environment: {
                TABLE_USERS_BANK_ACCOUNT_HISTORY_NAME: props.userCreditBankAccountTable.tableName
            },
            tracing: Tracing.ACTIVE,
            timeout: Duration.minutes(1)
        });

        this.lambdaFunction.addToRolePolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            resources: [props.userCreditBankAccountTable.tableArn],
            actions: [
                "dynamodb:Scan",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
            ]
        }));
    }

}