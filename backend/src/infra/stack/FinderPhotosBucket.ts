import {CfnOutput, RemovalPolicy, Stack, StackProps} from "aws-cdk-lib";
import {Bucket, HttpMethods, ObjectOwnership, BucketAccessControl, BlockPublicAccess} from "aws-cdk-lib/aws-s3";
import {Construct} from "constructs";
import {getSuffixFromStack} from "./utils/Utils";

export class FinderPhotosBucket extends Stack {

    public readonly photoBucket: Bucket;
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const suffix = getSuffixFromStack(this);

        this.photoBucket = new Bucket(this, 'FinderPhotos', {
            bucketName: `finder-photos-${suffix}`,
            cors: [{
                allowedMethods: [
                    HttpMethods.HEAD,
                    HttpMethods.GET,
                    HttpMethods.PUT
                ],
                allowedOrigins: ['*'],
                allowedHeaders: ['*']
            }],
            objectOwnership: ObjectOwnership.OBJECT_WRITER,
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            blockPublicAccess: {
                blockPublicAcls: false,
                blockPublicPolicy: false,
                ignorePublicAcls: false,
                restrictPublicBuckets: false
            },
            publicReadAccess: true
        });
        new CfnOutput(this, 'FinderPhotosBucketName', {
            value: this.photoBucket.bucketName
        });
    }
}