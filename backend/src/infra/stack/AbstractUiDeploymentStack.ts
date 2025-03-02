import { Stack, StackProps } from "aws-cdk-lib";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { join } from "path";
import { existsSync } from "fs";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { OriginAccessIdentity } from "aws-cdk-lib/aws-cloudfront";
import {getSuffixFromStack} from "./utils/Utils";

export abstract class AbstractUiDeploymentStack extends Stack {

    protected readonly deploymentBucket: Bucket;
    protected readonly originIdentity: OriginAccessIdentity;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const suffix = getSuffixFromStack(this);

        this.deploymentBucket = new Bucket(this, 'uiDeploymentBucket', {
            bucketName: `ui-${suffix}`
        });

        const uiDir = join(process.cwd(), "..", "ui", "dist");
        if (!existsSync(uiDir)) {
            console.warn('Ui dir not found: ' + uiDir);
            return;
        }

        const bucketDeployment = new BucketDeployment(this, 'UiDeployment', {
            destinationBucket: this.deploymentBucket,
            sources: [Source.asset(uiDir)]
        });

        this.originIdentity = new OriginAccessIdentity(this, 'OriginAccessIdentity');
        this.deploymentBucket.grantRead(this.originIdentity);
    }
}