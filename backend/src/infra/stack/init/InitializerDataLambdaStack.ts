import {Construct} from "constructs";
import {Duration, Stack, StackProps} from "aws-cdk-lib";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import {Runtime, Tracing} from "aws-cdk-lib/aws-lambda";
import {join} from "path";
import {Effect, PolicyStatement, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {getSuffixFromStack} from "../utils/Utils";
import {ITable} from "aws-cdk-lib/aws-dynamodb";
import {AwsCustomResource, AwsCustomResourcePolicy, AwsSdkCall, PhysicalResourceId} from "aws-cdk-lib/custom-resources";
import {Bucket} from "aws-cdk-lib/aws-s3";
import { UserPool } from "aws-cdk-lib/aws-cognito";

export interface InitializerDataLambdaStackProps extends StackProps {
    productTable: ITable
    photoBucket: Bucket,
    userPoolClientId: string,
    userPool: UserPool
}

export class InitializerDataLambdaStack extends Stack {

    constructor(scope: Construct, id: string, props: InitializerDataLambdaStackProps) {
        super(scope, id, props);

        const suffix = getSuffixFromStack(this);

        const lambda = new NodejsFunction(this, "InitializerDataLambda", {
            functionName: `initializer-data-${suffix}`,
            runtime: Runtime.NODEJS_18_X,
            handler: "handler",
            entry: (join(process.cwd(), "src", "services", "init", "handler.ts")),
            environment: {
                TABLE_PRODUCTS_NAME: props.productTable.tableName,
                BUCKET_PHOTO_NAME: props.photoBucket.bucketName,
                REGION: this.region,
                CLIENT_ID: props.userPoolClientId
            },
            tracing: Tracing.ACTIVE,
            timeout: Duration.minutes(1),
            bundling: {
                loader: { '.jpg': 'file' }
            },
        });

        props.photoBucket.grantPut(lambda);
        props.userPool.grant(lambda)

        lambda.addToRolePolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            resources: [props.productTable.tableArn],
            actions: [
                "dynamodb:PutItem"
            ]
        }));

        lambda.addToRolePolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            resources: [props.userPool.userPoolArn],
            actions: [
                "cognito-idp:SignUp"
            ]
        }));

        lambda.addToRolePolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            resources: [props.photoBucket.bucketArn],
            actions: [
                "s3:PutObject"
            ]
        }));

        const sdkCall: AwsSdkCall = {
            service: "Lambda",
            action: "invoke",
            parameters: {
                FunctionName: lambda.functionName,
            },
            physicalResourceId: PhysicalResourceId.of(`${id}-AwsSdkCall-${lambda.currentVersion.version + suffix}`)
        }

        const customResourceFnRole = new Role(this, "InitializeDataAwsCustomResourceRole", {
            assumedBy: new ServicePrincipal("lambda.amazonaws.com")
        })
        customResourceFnRole.addToPolicy(
            new PolicyStatement({
                resources: [lambda.functionArn],
                actions: [
                    "lambda:InvokeFunction"
                ]
            })
        )
        new AwsCustomResource(this, "InitializeDataAwsCustomResource", {
            policy: AwsCustomResourcePolicy.fromSdkCalls({ resources: AwsCustomResourcePolicy.ANY_RESOURCE }),
            onUpdate: sdkCall,
            timeout: Duration.minutes(10),
            role: customResourceFnRole
        });
    }
}