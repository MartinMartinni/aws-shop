import {Construct} from "constructs";
import {Stack, StackProps} from "aws-cdk-lib";
import {ProductDataStack} from "./ProductDataStack";
import {ProductLambdaStack} from "./ProductLambdaStack";
import {ITable} from "aws-cdk-lib/aws-dynamodb";
import {LambdaIntegration} from "aws-cdk-lib/aws-apigateway";

export class ProductStack extends Stack {

    public readonly productTable: ITable;
    public readonly productSoldTable: ITable;
    public readonly productLambdaIntegration: LambdaIntegration

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const productDataStack = new ProductDataStack(this, "ProductDataStack");
        const productLambdaStack = new ProductLambdaStack(this, "ProductLambdaStack", {
            productTable: productDataStack.productTable
        });

        this.productTable = productDataStack.productTable;
        this.productSoldTable = productDataStack.productSoldTable;
        this.productLambdaIntegration = productLambdaStack.productLambdaIntegration;
    }
}