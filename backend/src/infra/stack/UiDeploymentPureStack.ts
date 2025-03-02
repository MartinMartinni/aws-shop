import { CfnOutput, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Distribution } from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { AbstractUiDeploymentStack } from "./AbstractUiDeploymentStack";

export class UiDeploymentPureStack extends AbstractUiDeploymentStack {

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        this.deploy();
    }

    public deploy(): void {
        const distribution = new Distribution(this, 'UiDistribution', {
            defaultRootObject: 'index.html',
            defaultBehavior: {
                origin: new S3Origin(this.deploymentBucket, {
                    originAccessIdentity: this.originIdentity
                })
            }
        });

        new CfnOutput(this, 'FinderUrl', {
            value: distribution.distributionDomainName
        });
    }
}