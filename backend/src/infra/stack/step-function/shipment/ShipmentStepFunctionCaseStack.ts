import {RemovalPolicy, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {AbstractLambdaStepFunctionCaseStack} from "../AbstractLambdaStepFunctionCaseStack";
import {join} from "path";
import {AttributeType, ITable, Table} from "aws-cdk-lib/aws-dynamodb";
import {getSuffixFromStack} from "../../utils/Utils";
import {Effect, PolicyStatement} from "aws-cdk-lib/aws-iam";

export class ShipmentStepFunctionCaseStack extends AbstractLambdaStepFunctionCaseStack {

    readonly shipmentTable: ITable;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const suffix = getSuffixFromStack(this);

        this.shipmentTable = new Table(this, "ShipmentTable", {
            partitionKey: {
                name: "id",
                type: AttributeType.STRING
            },
            tableName: `shipment-${suffix}`,
            removalPolicy: RemovalPolicy.DESTROY
        });

        this.lambdaFunction = this.createLambdaFunction(id, {
            functionName: `shipment-case-${suffix}`,
            entry: (join(process.cwd(), "src", "services", "step-function", "shipment", "handler.ts")),
            environment: {
                TABLE_SHIPMENTS_NAME: this.shipmentTable.tableName
            }
        });
        this.lambdaInvoke = this.createLambdaInvoke(id, {
            lambdaFunction: this.lambdaFunction
        });

        this.lambdaFunction.addToRolePolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            resources: [this.shipmentTable.tableArn],
            actions: [
                "dynamodb:PutItem"
            ]
        }));
    }
}