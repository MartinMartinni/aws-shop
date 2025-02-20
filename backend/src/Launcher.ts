#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ApiStack as ApiStack } from "./infra/stack/ApiStack";
import {AuthStack} from "./infra/stack/AuthStack";
import {FinderPhotosBucket} from "./infra/stack/FinderPhotosBucket";
import {RdsInitStack, RdsConfig} from "../docker/db-init/RdsInitStack";
import {StepFunctionOrderWorkflowStack} from "./infra/stack/step-function/StepFunctionOrderWorkflowStack";
import {OrderStatusEventBridgeStack} from "./infra/stack/order/OrderStatusEventBridgeStack";
import {OrderStatusResultLambdaStack} from "./infra/stack/order/OrderStatusResultLambdaStack";
import {WebSocketApiStack} from "./infra/stack/WebSocketApiStack";
import {UserStack} from "./infra/stack/user/UserStack";
import {ProductStack} from "./infra/stack/product/ProductStack";
import {InitializerDataLambdaStack} from "./infra/stack/init/InitializerDataLambdaStack";
import {UiDeploymentStack} from "./infra/stack/UiDeploymentStack";
import {OrderLambdaRDSStack} from "./infra/stack/order/OrderLambdaRDSStack";
import {OrderLambdaDynamoStack} from "./infra/stack/order/OrderLambdaDynamoStack";
import {CICDPipelinesStack} from "./infra/stack/CICDPipelinesStack";

import {AbstractOrdeStack} from "./infra/stack/order/AbstractOrdeStack";
import { ITable } from "aws-cdk-lib/aws-dynamodb";

const ordersDBType = process.env.ORDERS_DB_TYPE?.toUpperCase() || "DYNAMO";

console.log("process.env.ORDERS_DB_TYPE?.toUpperCase(): ", process.env.ORDERS_DB_TYPE?.toUpperCase());

const app = new cdk.App();
const finderPhotosBucket = new FinderPhotosBucket(app, "PhotoBucket");
const authStack = new AuthStack(app, "AuthStack", {
    photoBucket: finderPhotosBucket.photoBucket
});

const productStack = new ProductStack(app, "ProductStack");

const initializerDataLambdaStack = new InitializerDataLambdaStack(app, "InitializerDataLambdaStack", {
    productTable: productStack.productTable,
    photoBucket: finderPhotosBucket.photoBucket
});

let rdsInitStack = {} as RdsInitStack;
let orderStack = {} as AbstractOrdeStack;
let orderTable: ITable | undefined;
if (ordersDBType === "RDS") {
    rdsInitStack = new RdsInitStack(app, "RdsInitStack");
    orderStack = new OrderLambdaRDSStack(app, "OrderLambdaRDSStack", {
        rdsConfig: rdsInitStack.rdsConfig
    });
} else {
    const orderLambdaStack = new OrderLambdaDynamoStack(app, "OrderLambdaDynamoStack") as OrderLambdaDynamoStack;
    orderTable = orderLambdaStack.orderTable;
    orderStack = orderLambdaStack;
}

const userStack = new UserStack(app, "UserStack", {
    userPool: authStack.userPool
});

const eventBridgeStack = new OrderStatusEventBridgeStack(app, "EventBridgeStack");

const stepFunctionOrderWorkflowStack = new StepFunctionOrderWorkflowStack(app, "StepFunctionOrderWorkflowStack", {
    productTable: productStack.productTable,
    productSoldTable: productStack.productSoldTable,
    userTable: userStack.userTable,
    userBankAccountHistoryTable: userStack.userBankAccountHistoryTable,
    eventBus: eventBridgeStack.eventBus,
    rdsConfig: rdsInitStack.rdsConfig,
    orderTable: orderTable
});

const orderStatusResultLambdaStack = new OrderStatusResultLambdaStack(app, "OrderStatusResultLambdaStack", {
    connectionsTable: stepFunctionOrderWorkflowStack.orderFinalizationStack.connectionsTable,
    eventBus: eventBridgeStack.eventBus
});

const apiStack = new ApiStack(app, "RestApiStack", {
    productLambdaIntegration: productStack.productLambdaIntegration,
    userLambdaIntegration: userStack.userLambdaIntegration,
    orderLambdaIntegration: orderStack.getOrderLambdaIntegration(),
    userPool: authStack.userPool,
    userCreditBankAccountLambdaIntegration: userStack.userCreditBankAccountLambdaIntegration,
    stateMachine: stepFunctionOrderWorkflowStack.stateMachine
});

const webSocketApiStack = new WebSocketApiStack(app, "WebSocketApiStack", {
    orderFinalizationStack: stepFunctionOrderWorkflowStack.orderFinalizationStack,
    orderStatusResultLambda: orderStatusResultLambdaStack.lambdaFunction
});

const uiDeploymentStack = new UiDeploymentStack(app, "UiDeploymentStack");

const cicdPipelinesStack = new CICDPipelinesStack(app, "CICDPipelinesStack");