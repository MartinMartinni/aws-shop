import { CfnOutput, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Distribution, ViewerProtocolPolicy } from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { ARecord, IHostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import { AbstractUiDeploymentStack } from "./AbstractUiDeploymentStack";
import { CertificateSslStack } from "./CertificateSslStack";

export interface UiDeploymentWithDomainStackProps extends StackProps {
    domain: string
}

export class UiDeploymentWithDomainStack extends AbstractUiDeploymentStack {

    constructor(scope: Construct, id: string, props: UiDeploymentWithDomainStackProps) {
        super(scope, id, props);

        const domain = props.domain;

        const certificateStack = new CertificateSslStack(this, "CertificateSslStack", {
            env: props?.env,
            domain: domain
        });

        this.deploy(domain, certificateStack.certificate, certificateStack.hostedZone);
    }

    public deploy(
        domain: string,
        certificate: ICertificate,
        hostedZone: IHostedZone): void {
            
        const distribution = new Distribution(this, 'UiDistribution', {
            defaultRootObject: 'index.html',
            certificate: certificate,
            domainNames: [domain],
            defaultBehavior: {
                origin: new S3Origin(this.deploymentBucket, {
                    originAccessIdentity: this.originIdentity
                }),
                viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS
            }
        });

        new ARecord(this, 'AliasRecord', {
            zone: hostedZone,
            recordName: domain,
            target: RecordTarget.fromAlias(new CloudFrontTarget(distribution))
        });

        new CfnOutput(this, 'FinderUrl', {
            value: distribution.distributionDomainName
        });
    }
}