#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ApiStack as ApiStack } from "./infra/stack/ApiStack";
import {AuthStack} from "./infra/stack/AuthStack";
import {FinderPhotosBucket} from "./infra/stack/FinderPhotosBucket";
import {RdsInitStack} from "../docker/db-init/RdsInitStack";
import {StepFunctionOrderWorkflowStack} from "./infra/stack/step-function/StepFunctionOrderWorkflowStack";
import {OrderStatusEventBridgeStack} from "./infra/stack/order/OrderStatusEventBridgeStack";
import {OrderStatusResultLambdaStack} from "./infra/stack/order/OrderStatusResultLambdaStack";
import {WebSocketApiStack} from "./infra/stack/WebSocketApiStack";
import {UserStack} from "./infra/stack/user/UserStack";
import {ProductStack} from "./infra/stack/product/ProductStack";
import {InitializerDataLambdaStack} from "./infra/stack/init/InitializerDataLambdaStack";
import {OrderLambdaRDSStack} from "./infra/stack/order/OrderLambdaRDSStack";
import {OrderLambdaDynamoStack} from "./infra/stack/order/OrderLambdaDynamoStack";
import {CICDPipelinesMainStack} from "./infra/stack/cicd/CICDPipelinesMainStack";

import {AbstractOrdeStack} from "./infra/stack/order/AbstractOrdeStack";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { CICDPipelinesDevelopStack } from "./infra/stack/cicd/CICDPipelinesDevelopStack";
import { UiDeploymentWithDomainStack } from "./infra/stack/UiDeploymentWithDomainStack";
import { UiDeploymentPureStack } from "./infra/stack/UiDeploymentPureStack";

const ordersDBType = process.env.ORDERS_DB_TYPE?.toUpperCase() || "DYNAMO";
const deployUi = process.env.DEPLOY_UI ? JSON.parse(process.env.DEPLOY_UI.toLowerCase()) : false;
const domain = process.env.DOMAIN;

console.log("process.env.DEPLOY_UI: ", process.env.DEPLOY_UI, ", deployUi: ", deployUi);
console.log("process.env.DOMAIN: ", process.env.DOMAIN);
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

if (deployUi) {        
    if (domain) {
        const env = {
            account: process.env.CDK_DEFAULT_ACCOUNT,
            region: "us-east-1"  // only option to create ssl certificate
        };

        new UiDeploymentWithDomainStack(app, "UiDeploymentWithDomainStack", {
            env: env,
            domain: domain!
        });
    } else {
        new UiDeploymentPureStack(app, "UiDeploymentPureStack");
    }
}

const cicdPipelinesDevelopStack = new CICDPipelinesDevelopStack(app, "CICDPipelinesDevelopStack");
const cicdPipelinesMainStack = new CICDPipelinesMainStack(app, "CICDPipelinesMainStack");