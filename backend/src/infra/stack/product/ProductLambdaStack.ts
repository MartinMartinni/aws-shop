import {Duration, Stack, StackProps} from "aws-cdk-lib";
import {NodejsFunction} from 'aws-cdk-lib/aws-lambda-nodejs';
import {Construct} from "constructs";
import {Runtime, Tracing} from "aws-cdk-lib/aws-lambda";
import {join} from "path";
import {Effect, PolicyStatement} from "aws-cdk-lib/aws-iam";
import {LambdaIntegration} from "aws-cdk-lib/aws-apigateway";
import {ITable} from "aws-cdk-lib/aws-dynamodb";
import {getSuffixFromStack} from "../utils/Utils";

export interface ProductLambdaStackProps extends StackProps {
    productTable: ITable
}

export class ProductLambdaStack extends Stack {

    public readonly productLambdaIntegration: LambdaIntegration;
    constructor(scope: Construct, id: string, props: ProductLambdaStackProps) {
        super(scope, id, props);

        const suffix = getSuffixFromStack(this);

        const productsLambda = new NodejsFunction(this, 'ProductLambda', {
            functionName: `product-${suffix}`,
            runtime: Runtime.NODEJS_18_X,
            handler: 'handler',
            entry: (join(__dirname, '..', '..', '..', 'services', 'product', 'handler.ts')),
            environment: {
                TABLE_PRODUCTS_NAME: props.productTable.tableName
            },
            tracing: Tracing.ACTIVE,
            timeout: Duration.minutes(1)
        });

        productsLambda.addToRolePolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            resources: [props.productTable.tableArn],
            actions: [
                "dynamodb:Scan",
                "dynamodb:PutItem",
                "dynamodb:GetItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:BatchGetItem",
                "dynamodb:BatchWriteItem"
            ]
        }));

        this.productLambdaIntegration = new LambdaIntegration(productsLambda);
    }
}