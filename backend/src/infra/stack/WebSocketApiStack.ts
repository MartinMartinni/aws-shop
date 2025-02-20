import {CfnOutput, Fn, Stack, StackProps} from "aws-cdk-lib";
import {Runtime, Tracing} from "aws-cdk-lib/aws-lambda";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import {join} from "path";
import {Effect, PolicyStatement} from "aws-cdk-lib/aws-iam";
import {WebSocketApi, WebSocketStage} from "@aws-cdk/aws-apigatewayv2-alpha";
import {WebSocketLambdaIntegration} from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import {Construct} from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { AbstractOrderFinalizationStepFunctionCaseStack } from "./step-function/AbstractOrderFinalizationStepFunctionCaseStack";


export interface WebSocketApiStackProps extends StackProps {
    orderFinalizationStack: AbstractOrderFinalizationStepFunctionCaseStack
    orderStatusResultLambda: lambda.Function
}

export class WebSocketApiStack extends Stack {

    constructor(scope: Construct, id: string, props: WebSocketApiStackProps) {
        super(scope, id, props);

        const nodeJsFunctionProps = {
            handler: "handler",
            runtime: Runtime.NODEJS_18_X,
            tracing: Tracing.ACTIVE,
            environment: {
                TABLE_CONNECTIONS_NAME: props.orderFinalizationStack.connectionsTable.tableName!
            }
        }

        const onConnectHandler = new NodejsFunction(this, "OnConnectHandler", {
            entry: join(__dirname, "..", "..", "services", "websocket", "OnConnect.ts"),
            ...nodeJsFunctionProps
        });

        const onDisconnectHandler = new NodejsFunction(this, "OnDisconnectHandler", {
            entry: join(__dirname, "..", "..", "services", "websocket", "ondisconnect.ts"),
            ...nodeJsFunctionProps
        });

        const onMessageHandler = new NodejsFunction(this, "OnMessageHandler", {
            entry: join(__dirname, "..", "..", "services", "websocket", "onMessage.ts"),
            ...nodeJsFunctionProps
        });

        onMessageHandler.addToRolePolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            resources: [props.orderFinalizationStack.connectionsTable.tableArn],
            actions: [
                "dynamodb:PutItem"
            ]
        }));

        const webSocketApi = new WebSocketApi(this, "PlaceOrderStatusTrackerWebsocketApi", {
            apiName: "Place order status tracker Websocket API",
            connectRouteOptions: {integration: new WebSocketLambdaIntegration("ConnectIntegration", onConnectHandler)},
            disconnectRouteOptions: {integration: new WebSocketLambdaIntegration("DisconnectIntegration", onDisconnectHandler)},
            defaultRouteOptions: {integration: new WebSocketLambdaIntegration("DefaultIntegration", onMessageHandler)}
        });

        const route = webSocketApi.addRoute("trackStatus", {integration: new WebSocketLambdaIntegration("TrackStatusIntegration", onMessageHandler)})

        const prodStage = new WebSocketStage(this, "dev", {
            webSocketApi: webSocketApi,
            stageName: "dev",
            autoDeploy: true,
        });

        webSocketApi.grantManageConnections(props.orderStatusResultLambda);

        new CfnOutput(this, 'WebSocketApiEndpoint', {
            value: webSocketApi.apiEndpoint,
            description: 'WebSocket URL',
        });

        new CfnOutput(this, 'WebSocketApiId', {
            value: webSocketApi.apiId,
            description: 'WebSocket ApiId',
        });
        
        new CfnOutput(this, 'WebSocketApiName', {
            value: webSocketApi.webSocketApiName!,
            description: 'WebSocket webSocketApiName',
        });

        new CfnOutput(this, 'WebSocketRouteId', {
            value: route.routeId,
            description: 'WebSocket RouteId',
        });
    }
}