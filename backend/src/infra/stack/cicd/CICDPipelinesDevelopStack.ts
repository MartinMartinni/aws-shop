import {Construct} from "constructs";
import {AbstractCICDPipelinesStack} from "./AbstractCICDPipelinesStack";
import {StackProps} from "aws-cdk-lib";

export class CICDPipelinesDevelopStack extends AbstractCICDPipelinesStack {

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, {
            ...props,
            suffix: "Develop",
            branch: "develop"
        });
    }
}