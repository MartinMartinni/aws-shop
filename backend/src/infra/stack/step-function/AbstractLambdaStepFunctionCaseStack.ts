import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import {Duration, Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {NodejsFunction, NodejsFunctionProps} from "aws-cdk-lib/aws-lambda-nodejs";
import {Runtime, Tracing} from "aws-cdk-lib/aws-lambda";
import * as lambda from "aws-cdk-lib/aws-lambda";

export abstract class AbstractLambdaStepFunctionCaseStack extends Stack {
    protected lambdaInvoke: tasks.LambdaInvoke;
    protected lambdaFunction: lambda.Function

    protected constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);
    }

    protected createLambdaFunction(id: string, props?: NodejsFunctionProps) {
        return new NodejsFunction(this, `${id}CaseLambda`, {
            ...props,
            runtime: Runtime.NODEJS_18_X,
            handler: "handler",
            tracing: Tracing.ACTIVE,
            timeout: Duration.minutes(1)
        });
    }

    protected createLambdaInvoke(id: string, props: tasks.LambdaInvokeProps) {
        return new tasks.LambdaInvoke(this, `${id}Case`, {
            ...props,
            outputPath: '$.Payload'
        })
    }

    getLambdaInvoke(): tasks.LambdaInvoke {
        return this.lambdaInvoke;
    }

    getLambdaFunction(): lambda.Function {
        return this.lambdaFunction;
    }
}