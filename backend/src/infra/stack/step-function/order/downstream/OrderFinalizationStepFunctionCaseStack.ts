import {RemovalPolicy, StackProps} from "aws-cdk-lib";
import {AbstractLambdaStepFunctionCaseStack} from "../../AbstractLambdaStepFunctionCaseStack";
import {Construct} from "constructs";
import {Effect, PolicyStatement} from "aws-cdk-lib/aws-iam";
import {AttributeType, ITable, Table} from "aws-cdk-lib/aws-dynamodb";
import {join} from "path";
import {getSuffixFromStack} from "../../../utils/Utils";
import {RdsConfig} from "../../../../../../docker/db-init/RdsInitStack";
import {SubnetType} from "aws-cdk-lib/aws-ec2";

export interface OrderFinalizationStepFunctionCaseStackProps extends StackProps {
    rdsConfig: RdsConfig
}

export class OrderFinalizationStepFunctionCaseStack extends AbstractLambdaStepFunctionCaseStack {

    readonly connectionsTable: ITable;
    constructor(scope: Construct, id: string, props: OrderFinalizationStepFunctionCaseStackProps) {
        super(scope, id, props);

        const suffix = getSuffixFromStack(this);

        this.connectionsTable = new Table(this, "ConnectionsTable", {
            partitionKey: {
                name: "id",
                type: AttributeType.STRING
            },
            tableName: `connection-${suffix}`,
            removalPolicy: RemovalPolicy.DESTROY
        });

        this.lambdaFunction = this.createLambdaFunction(id, {
            functionName: `order-finalization-case-${suffix}`,
            entry: (join(__dirname, "..", "..", "..", "..", "..", "services", "step-function", "order", "downstream", "finalization", "handler.ts")),
            environment: {
                TABLE_CONNECTIONS_NAME: this.connectionsTable.tableName,
                DB_SECRET_ARN: props.rdsConfig.dbServer.secret?.secretArn || "",
            },
            vpc: props.rdsConfig.vpc,
            vpcSubnets: props.rdsConfig.dbServer.vpc.selectSubnets({
                subnetType: SubnetType.PRIVATE_WITH_EGRESS
            }),
            securityGroups: [props.rdsConfig.secretGroup]
        });
        this.lambdaInvoke = this.createLambdaInvoke(id, {
            lambdaFunction: this.lambdaFunction
        });
        this.lambdaFunction.addToRolePolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            resources: [
                this.connectionsTable.tableArn
            ],
            actions: [
                "dynamodb:Scan"
            ]
        }));

        props.rdsConfig.dbServer.secret?.grantRead(this.lambdaFunction);
    }
}