import {Duration, Stack, StackProps} from "aws-cdk-lib";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import {Construct} from "constructs";
import {Runtime, Tracing} from "aws-cdk-lib/aws-lambda";
import {join} from "path";
import {ManagedPolicy} from "aws-cdk-lib/aws-iam";
import {LambdaIntegration} from "aws-cdk-lib/aws-apigateway";
import {Port, SubnetType} from "aws-cdk-lib/aws-ec2";
import {RdsConfig} from "../../../../docker/db-init/RdsInitStack";
import {getSuffixFromStack} from "../utils/Utils";

export interface LambdaStackIntegration extends StackProps {
    rdsConfig: RdsConfig
}

export class OrderLambdaStack extends Stack {

    public readonly ordersLambdaIntegration: LambdaIntegration;
    constructor(scope: Construct, id: string, props: LambdaStackIntegration) {
        super(scope, id, props);

        const suffix = getSuffixFromStack(this);

        const ordersLambda = new NodejsFunction(this, "OrderLambda", {
            functionName: `order-${suffix}`,
            runtime: Runtime.NODEJS_18_X,
            handler: "handler",
            entry: (join(__dirname, "..", "..", "..", "services" , "order", "handler.ts")),
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

        this.ordersLambdaIntegration = new LambdaIntegration(ordersLambda);
    }
}