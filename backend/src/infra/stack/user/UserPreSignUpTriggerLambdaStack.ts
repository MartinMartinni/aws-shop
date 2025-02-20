import {Duration, Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import {Runtime, Tracing} from "aws-cdk-lib/aws-lambda";
import {join} from "path";
import {ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {getSuffixFromStack} from "../utils/Utils";
import {UserPool} from "aws-cdk-lib/aws-cognito";

export interface UserPreSignUpTriggerLambdaStackProps extends StackProps {
    userPool: UserPool
}

export class UserPreSignUpTriggerLambdaStack extends Stack {
    public readonly preSignUpLambdaFunction: NodejsFunction;

    constructor(scope: Construct, id: string, props: UserPreSignUpTriggerLambdaStackProps) {
        super(scope, id, props);

        const suffix = getSuffixFromStack(this);

        this.preSignUpLambdaFunction = new NodejsFunction(this, "UserPreSignUpTriggerLambda", {
            functionName: `user-pre-sign-up-trigger-${suffix}`,
            runtime: Runtime.NODEJS_18_X,
            handler: "handler",
            entry: (join(process.cwd(), "src", "services", "user", "pre-sign-up-trigger", "handler.ts")),
            environment: {},
            tracing: Tracing.ACTIVE,
            timeout: Duration.minutes(1)
        });

        const invokeCognitoTriggerPermission = {
            principal: new ServicePrincipal('cognito-idp.amazonaws.com'),
            sourceArn: props.userPool.userPoolArn
        }

        this.preSignUpLambdaFunction.addPermission('InvokePreSignUpHandlerPermission', invokeCognitoTriggerPermission)
    }
}