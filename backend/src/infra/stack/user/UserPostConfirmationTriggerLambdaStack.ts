import {Duration, Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import {Runtime, Tracing} from "aws-cdk-lib/aws-lambda";
import {join} from "path";
import {ITable} from "aws-cdk-lib/aws-dynamodb";
import {Effect, PolicyStatement, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {getSuffixFromStack} from "../utils/Utils";
import {UserPool} from "aws-cdk-lib/aws-cognito";
import {AuthStack} from "../AuthStack";


export interface UserPostConfirmationTriggerLambdaStackProps extends StackProps {
    userTable: ITable,
    userCreditBankAccountTable: ITable
    userPool: UserPool
}

export class UserPostConfirmationTriggerLambdaStack extends Stack {
    public readonly postConfirmationLambdaFunction: NodejsFunction;

    constructor(scope: Construct, id: string, props: UserPostConfirmationTriggerLambdaStackProps) {
        super(scope, id, props);

        const suffix = getSuffixFromStack(this);

        this.postConfirmationLambdaFunction = new NodejsFunction(this, "UserPostConfirmationTriggerLambda", {
            functionName: `user-post-confirmation-trigger-${suffix}`,
            runtime: Runtime.NODEJS_18_X,
            handler: "handler",
            entry: (join(__dirname, "..", "..", "..", "services", "user", "post-confirmation-trigger", "handler.ts")),
            environment: {
                TABLE_USERS_NAME: props.userTable.tableName,
                TABLE_USERS_BANK_ACCOUNT_HISTORY_NAME: props.userCreditBankAccountTable.tableName,
                USER_POOL_ID: props.userPool.userPoolId,
                ADMIN_GROUP_NAME: AuthStack.ADMIN_GROUP_NAME
            },
            tracing: Tracing.ACTIVE,
            timeout: Duration.minutes(1)
        });

        this.postConfirmationLambdaFunction.addToRolePolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            resources: [props.userTable.tableArn],
            actions: [
                "dynamodb:Scan",
                "dynamodb:PutItem"
            ]
        }));

        this.postConfirmationLambdaFunction.addToRolePolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            resources: [props.userCreditBankAccountTable.tableArn],
            actions: [
                "dynamodb:PutItem"
            ]
        }));

        this.postConfirmationLambdaFunction.addToRolePolicy(
            new PolicyStatement({
                effect: Effect.ALLOW,
                resources: [props.userPool.userPoolArn],
                actions: [
                    "cognito-idp:AdminAddUserToGroup"
                ]
            })
        );

        const invokeCognitoTriggerPermission = {
            principal: new ServicePrincipal('cognito-idp.amazonaws.com'),
            sourceArn: props.userPool.userPoolArn
        }

        this.postConfirmationLambdaFunction.addPermission('InvokePreSignUpHandlerPermission', invokeCognitoTriggerPermission);
    }
}