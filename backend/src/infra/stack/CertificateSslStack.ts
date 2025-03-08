import { Stack, StackProps } from "aws-cdk-lib";
import { Certificate, CertificateValidation, ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import { HostedZone, IHostedZone, PublicHostedZone } from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";

export interface CertificateSslStackProps extends StackProps {
    domain: string
}

export class CertificateSslStack extends Stack {

    public readonly certificate: ICertificate;
    public readonly hostedZone: IHostedZone;

    constructor(scope: Construct, id: string, props: CertificateSslStackProps) {
        super(scope, id, props);
        
        this.hostedZone = new PublicHostedZone(this, "HostedZone", {
            zoneName: props.domain
        });

        // this.hostedZone = HostedZone.fromLookup(this, "HostedZone", {
        //     domainName: props.domain
        // });

        const cert = CertificateValidation.fromDns(this.hostedZone);

        console.log("cert: ", cert);

        this.certificate = new Certificate(this, "Certificate", {
            domainName: props.domain,
            validation: cert
        })
    }
}