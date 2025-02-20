import {Stack, StackProps} from "aws-cdk-lib";
import {LambdaIntegration} from "aws-cdk-lib/aws-apigateway";
import {Construct} from "constructs";

export class AbstractOrdeStack extends Stack {

    protected orderLambdaIntegration: LambdaIntegration;

    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);
    };

    public getOrderLambdaIntegration(): LambdaIntegration {
        return this.orderLambdaIntegration;
    }
}