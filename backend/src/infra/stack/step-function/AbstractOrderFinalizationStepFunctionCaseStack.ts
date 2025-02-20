import {StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {AbstractLambdaStepFunctionCaseStack} from "./AbstractLambdaStepFunctionCaseStack";
import {ITable} from "aws-cdk-lib/aws-dynamodb";

export abstract class AbstractOrderFinalizationStepFunctionCaseStack extends AbstractLambdaStepFunctionCaseStack {
    
    public connectionsTable: ITable;
    protected constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);
    }
}