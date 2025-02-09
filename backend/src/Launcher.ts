#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ApiStack as ApiStack } from "./infra/stack/ApiStack";
import {AuthStack} from "./infra/stack/AuthStack";
import {FinderPhotosBucket} from "./infra/stack/FinderPhotosBucket";
import {OrderStack} from "./infra/stack/order/OrderStack";
import {RdsInitStack} from "../docker/db-init/RdsInitStack";
import {StepFunctionOrderWorkflowStack} from "./infra/stack/step-function/StepFunctionOrderWorkflowStack";
import {OrderStatusEventBridgeStack} from "./infra/stack/order/OrderStatusEventBridgeStack";
import {OrderStatusResultLambdaStack} from "./infra/stack/order/OrderStatusResultLambdaStack";
import {WebSocketApiStack} from "./infra/stack/WebSocketApiStack";
import {UserStack} from "./infra/stack/user/UserStack";
import {ProductStack} from "./infra/stack/product/ProductStack";
import {InitializerDataLambdaStack} from "./infra/stack/init/InitializerDataLambdaStack";
import {UiDeploymentStack} from "./infra/stack/UiDeploymentStack";

import {CICDPipelinesStack} from "./infra/stack/CICDPipelinesStack";



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

const rdsInitStack = new RdsInitStack(app, "RdsInitStack");

const orderStack = new OrderStack(app, "OrderStack", {
    rdsConfig: rdsInitStack.rdsConfig
});

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
    rdsConfig: rdsInitStack.rdsConfig
});

const orderStatusResultLambdaStack = new OrderStatusResultLambdaStack(app, "OrderStatusResultLambdaStack", {
    connectionsTable: stepFunctionOrderWorkflowStack.orderFinalizationStack.connectionsTable,
    eventBus: eventBridgeStack.eventBus
});

const apiStack = new ApiStack(app, "RestApiStack", {
    productLambdaIntegration: productStack.productLambdaIntegration,
    userLambdaIntegration: userStack.userLambdaIntegration,
    orderLambdaIntegration: orderStack.orderLambdaIntegration,
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