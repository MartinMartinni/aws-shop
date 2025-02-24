import {Construct} from "constructs";
import {ManualApprovalAction} from "aws-cdk-lib/aws-codepipeline-actions";
import {AbstractCICDPipelinesStack} from "./AbstractCICDPipelinesStack";
import {StackProps} from "aws-cdk-lib";

export class CICDPipelinesMainStack extends AbstractCICDPipelinesStack {

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, {
            ...props,
            suffix: "Main",
            branch: "main"
        });
      
        const deployAction = new ManualApprovalAction({
            actionName: "Approve_Deploy",
            runOrder: 1,
        });
      
        this.pipeline.addStage({
            stageName: "Deploy",
            actions: [deployAction],
        });
    }
}