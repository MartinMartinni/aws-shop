import {Duration, Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {UserPool} from "aws-cdk-lib/aws-cognito";
import {Function, Runtime, Tracing} from "aws-cdk-lib/aws-lambda";
import {AwsCustomResource, AwsCustomResourcePolicy, AwsSdkCall, PhysicalResourceId} from "aws-cdk-lib/custom-resources";
import {Effect, PolicyStatement, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import {join} from "path";
import {getSuffixFromStack} from "../utils/Utils";

export interface UserPostConfirmationTriggerCustomResourceLambdaStackProps extends StackProps {
    userPool: UserPool
    lambdaFunction: Function
}

export class UserPostConfirmationTriggerCustomResourceLambdaStack extends Stack {

    constructor(scope: Construct, id: string, props: UserPostConfirmationTriggerCustomResourceLambdaStackProps) {
        super(scope, id, props);

        const self = this;
        const suffix = getSuffixFromStack(self);

        const lambda = new NodejsFunction(this, "UserPostConfirmationTriggerCustomResourceLambda", {
            functionName: `user-post-confirmation-trigger-custom-resource-${suffix}`,
            runtime: Runtime.NODEJS_18_X,
            handler: "handler",
            entry: (join(__dirname, "..", "..", "..", "services", "user", "post-confirmation-trigger", "settingTrigger.ts")),
            environment: {
                USER_POOL_ID: props.userPool.userPoolId,
                POST_CONFIRMATION_TRIGGER: props.lambdaFunction.functionArn
            },
            tracing: Tracing.ACTIVE,
            timeout: Duration.minutes(1)
        });

        const sdkCall: AwsSdkCall = {
            service: "Lambda",
            action: "invoke",
            parameters: {
                FunctionName: lambda.functionName
            },
            physicalResourceId: PhysicalResourceId.of(`${id}-AwsSdkCall-${lambda.currentVersion.version}`)
        }

        const customResourceFnRole = new Role(this, "AwsCustomResourceUserPostConfirmationRole", {
            assumedBy: new ServicePrincipal("lambda.amazonaws.com")
        })
        customResourceFnRole.addToPolicy(
            new PolicyStatement({
                resources: [lambda.functionArn],
                actions: ["lambda:InvokeFunction"]
            })
        )

        lambda.addToRolePolicy(
            new PolicyStatement({
                effect: Effect.ALLOW,
                resources: [props.userPool.userPoolArn],
                actions: [
                    "cognito-idp:DescribeUserPool",
                    "cognito-idp:UpdateUserPool"
                ]
            })
        );

        new AwsCustomResource(this, "AwsCustomResource", {
            policy: AwsCustomResourcePolicy.fromSdkCalls({ resources: AwsCustomResourcePolicy.ANY_RESOURCE }),
            onUpdate: sdkCall,
            timeout: Duration.minutes(10),
            role: customResourceFnRole
        })
    }
}