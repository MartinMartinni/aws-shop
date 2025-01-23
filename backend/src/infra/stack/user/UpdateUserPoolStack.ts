import {Duration, Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {UserPool} from "aws-cdk-lib/aws-cognito";
import {Function, Runtime, Tracing} from "aws-cdk-lib/aws-lambda";
import {AwsCustomResource, AwsCustomResourcePolicy, AwsSdkCall, PhysicalResourceId} from "aws-cdk-lib/custom-resources";
import {Effect, PolicyStatement, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import {join} from "path";
import {getSuffixFromStack} from "../utils/Utils";

export interface UpdateUserPoolStackProps extends StackProps {
    userPool: UserPool
    postConfirmationLambdaFunction: Function,
    preSignUpLambdaFunction: Function
}

export class UpdateUserPoolStack extends Stack {

    constructor(scope: Construct, id: string, props: UpdateUserPoolStackProps) {
        super(scope, id, props);

        const suffix = getSuffixFromStack(this);

        const lambda = new NodejsFunction(this, "UserPostConfirmationTriggerUpdateUserPoolLambda", {
            functionName: `user-post-confirmation-trigger-update-user-pool-${suffix}`,
            runtime: Runtime.NODEJS_18_X,
            handler: "handler",
            entry: (join(__dirname, "..", "..", "..", "services", "user", "update-user-pool", "handler.ts")),
            environment: {
                USER_POOL_ID: props.userPool.userPoolId,
                POST_CONFIRMATION_TRIGGER: props.postConfirmationLambdaFunction.functionArn,
                PRE_SIGN_UP_TRIGGER: props.preSignUpLambdaFunction.functionArn
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

        const customResourceFnRole = new Role(this, "UserPostConfirmationTriggerUpdateUserPoolAwsCustomResourceRole", {
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

        new AwsCustomResource(this, "UserPostConfirmationTriggerUpdateUserPoolAwsCustomResource", {
            policy: AwsCustomResourcePolicy.fromSdkCalls({ resources: AwsCustomResourcePolicy.ANY_RESOURCE }),
            onUpdate: sdkCall,
            timeout: Duration.minutes(10),
            role: customResourceFnRole
        });
    }
}