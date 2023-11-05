import {AbstractLambdaStepFunctionCaseStack} from "../../AbstractLambdaStepFunctionCaseStack";
import {Construct} from "constructs";
import {join} from "path";
import {StackProps} from "aws-cdk-lib";
import {ITable} from "aws-cdk-lib/aws-dynamodb";
import {Effect, PolicyStatement} from "aws-cdk-lib/aws-iam";
import {getSuffixFromStack} from "../../../utils/Utils";
import {RdsConfig} from "../../../../../../docker/db-init/RdsInitStack";
import {SubnetType} from "aws-cdk-lib/aws-ec2";

export interface OrderStepFunctionCaseStackProps extends StackProps {
    userTable: ITable,
    productTable: ITable,
    rdsConfig: RdsConfig
}

export class OrderStepFunctionCaseStack extends AbstractLambdaStepFunctionCaseStack {
    constructor(scope: Construct, id: string, props: OrderStepFunctionCaseStackProps) {
        super(scope, id, props);

        let suffix = getSuffixFromStack(this);

        this.lambdaFunction = this.createLambdaFunction(id, {
            functionName: `order-case-${suffix}`,
            entry: (join(__dirname, "..", "..", "..", "..", "..", "services", "step-function", "order", "downstream", "place-order", "handler.ts")),
            environment: {
                DB_SECRET_ARN: props.rdsConfig.dbServer.secret?.secretArn || "",
            },
            vpc: props.rdsConfig.vpc,
            vpcSubnets: props.rdsConfig.dbServer.vpc.selectSubnets({
                subnetType: SubnetType.PRIVATE_WITH_EGRESS
            }),
            securityGroups: [props.rdsConfig.secretGroup],
        });
        this.lambdaInvoke = this.createLambdaInvoke(id, {
            lambdaFunction: this.lambdaFunction
        });

        this.lambdaFunction.addToRolePolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            resources: [
                props.userTable.tableArn,
                props.productTable.tableArn
            ],
            actions: [
                "dynamodb:Scan",
                "dynamodb:PutItem",
                "dynamodb:GetItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:BatchGetItem"
            ]
        }));

        props.rdsConfig.dbServer.secret?.grantRead(this.lambdaFunction);
    }
}