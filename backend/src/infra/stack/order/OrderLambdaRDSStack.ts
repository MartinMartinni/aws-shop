import {Duration, StackProps} from "aws-cdk-lib";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import {Construct} from "constructs";
import {Runtime, Tracing} from "aws-cdk-lib/aws-lambda";
import {join} from "path";
import {ManagedPolicy} from "aws-cdk-lib/aws-iam";
import {LambdaIntegration} from "aws-cdk-lib/aws-apigateway";
import {Port, SubnetType} from "aws-cdk-lib/aws-ec2";
import {RdsConfig} from "../../../../docker/db-init/RdsInitStack";
import {getSuffixFromStack} from "../utils/Utils";
import {AbstractOrdeStack} from "./AbstractOrdeStack";

export interface OrderLambdaRDSStackProps extends StackProps {
    rdsConfig: RdsConfig
}

export class OrderLambdaRDSStack extends AbstractOrdeStack {

    constructor(scope: Construct, id: string, props: OrderLambdaRDSStackProps) {
        super(scope, id, props);

        const suffix = getSuffixFromStack(this);

        const ordersLambda = new NodejsFunction(this, "OrderLambdaRDS", {
            functionName: `order-${suffix}`,
            runtime: Runtime.NODEJS_18_X,
            handler: "handler",
            entry: (join(process.cwd(), "src", "services" , "order", "rds", "handler.ts")),
            environment: {
                DB_SECRET_ARN: props.rdsConfig.dbServer.secret?.secretArn || "",
            },
            vpc: props.rdsConfig.vpc,
            vpcSubnets: props.rdsConfig.dbServer.vpc.selectSubnets({
                subnetType: SubnetType.PRIVATE_WITH_EGRESS
            }),
            securityGroups: [props.rdsConfig.secretGroup],
            tracing: Tracing.ACTIVE,
            timeout: Duration.minutes(1),
            // allowPublicSubnet: true
        });

        ordersLambda.role?.addManagedPolicy(
            ManagedPolicy.fromAwsManagedPolicyName(
                "service-role/AWSLambdaBasicExecutionRole",
            ),
        );

        // only required if your function is in a VPC
        ordersLambda.role?.addManagedPolicy(
            ManagedPolicy.fromAwsManagedPolicyName(
                "service-role/AWSLambdaVPCAccessExecutionRole",
            ),
        );

        ordersLambda.node.addDependency(props.rdsConfig.dbServer)
        props.rdsConfig.dbServer.connections.allowFrom(ordersLambda, Port.tcp(3306))
        props.rdsConfig.dbServer.secret?.grantRead(ordersLambda);

        this.orderLambdaIntegration = new LambdaIntegration(ordersLambda);
    }
}