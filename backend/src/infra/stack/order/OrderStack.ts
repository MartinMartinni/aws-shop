import {Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {OrderLambdaStack} from "./OrderLambdaStack";
import {LambdaIntegration} from "aws-cdk-lib/aws-apigateway";
import {RdsConfig} from "../../../../docker/db-init/RdsInitStack";

export interface OrderStackProps extends StackProps {
    rdsConfig: RdsConfig
}

export class OrderStack extends Stack {

    public readonly orderLambdaIntegration: LambdaIntegration;

    constructor(scope: Construct, id: string, props: OrderStackProps) {
        super(scope, id, props);

        const orderLambdaStack = new OrderLambdaStack(this, "OrderLambdaStack", {
            rdsConfig: props.rdsConfig
        });

        this.orderLambdaIntegration = orderLambdaStack.ordersLambdaIntegration;
    }
}