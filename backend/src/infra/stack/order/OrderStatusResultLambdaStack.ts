import {Duration, Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import {Runtime, Tracing} from "aws-cdk-lib/aws-lambda";
import {join} from "path";
import {EventbridgeToLambdaProps, EventbridgeToLambda} from '@aws-solutions-constructs/aws-eventbridge-lambda';
import {ITable} from "aws-cdk-lib/aws-dynamodb";
import * as events from 'aws-cdk-lib/aws-events';
import {Effect, PolicyStatement} from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {getSuffixFromStack} from "../utils/Utils";

export interface OrderStatusResultLambdaStackProps extends StackProps {
    connectionsTable: ITable
    eventBus: events.IEventBus
}

export class OrderStatusResultLambdaStack extends Stack {

    public readonly lambdaFunction: lambda.Function;

    constructor(scope: Construct, id: string, props: OrderStatusResultLambdaStackProps) {
        super(scope, id, props);

        const suffix = getSuffixFromStack(this);

        this.lambdaFunction = new NodejsFunction(this, `OrderStatusResultLambda`, {
            functionName: `order-status-result-${suffix}`,
            entry: (join(process.cwd(), "src", "services", "order", "onReturnOrderStatus.ts")),
            environment: {
                TABLE_CONNECTIONS_NAME: props.connectionsTable.tableName!
            },
            runtime: Runtime.NODEJS_18_X,
            handler: "handler",
            tracing: Tracing.ACTIVE,
            timeout: Duration.minutes(1)
        });

        this.lambdaFunction.addToRolePolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            resources: [
                props.connectionsTable.tableArn
            ],
            actions: [
                "dynamodb:Scan"
            ]
        }));

        const constructProps: EventbridgeToLambdaProps = {
            existingLambdaObj: this.lambdaFunction,
            existingEventBusInterface: props.eventBus,
            eventRuleProps: {
                eventPattern: {
                    source: ['step.functions']
                }
            }
        };

        new EventbridgeToLambda(this, "EventBridgeToLambdaOrderStatusResultLambdaStack", constructProps);
    }
}