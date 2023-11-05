import {CdkResourceInitializer} from "../../src/infra/stack/utils/initDB/CdkResourceInitializer";
import {CfnOutput, Duration, RemovalPolicy, Stack, StackProps, Token} from "aws-cdk-lib";
import {InstanceClass, InstanceSize, InstanceType, Port, SecurityGroup, SubnetType, Vpc} from "aws-cdk-lib/aws-ec2";
import {Credentials, DatabaseInstance, DatabaseInstanceEngine, MysqlEngineVersion} from "aws-cdk-lib/aws-rds";
import {DockerImageCode} from "aws-cdk-lib/aws-lambda";
import {RetentionDays} from "aws-cdk-lib/aws-logs";
import {Construct} from "constructs";

export interface RdsConfig {
    dbServer: DatabaseInstance,
    vpc: Vpc,
    secretGroup: SecurityGroup
}

export class RdsInitStack extends Stack {

    public readonly rdsConfig: RdsConfig = new class implements RdsConfig {
        dbServer: DatabaseInstance;
        vpc: Vpc;
        secretGroup: SecurityGroup
    };

    constructor (scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props)

        const instanceIdentifier = "mysql"
        this.rdsConfig.vpc = new Vpc(this, "MyVPC", {
            maxAzs: 2,
            subnetConfiguration: [{
                cidrMask: 24,
                name: "ingress",
                subnetType: SubnetType.PUBLIC,
            },
            {
                cidrMask: 24,
                name: "compute",
                subnetType: SubnetType.PRIVATE_WITH_EGRESS,
            }]
        });

        this.rdsConfig.secretGroup = new SecurityGroup(this, "RdsSecurityGroup", {
            vpc: this.rdsConfig.vpc,
            description: "Security group for RDS MySQL",
            allowAllOutbound: true
        });

        this.rdsConfig.dbServer = new DatabaseInstance(this, "MysqlRdsInstance", {
            vpcSubnets: this.rdsConfig.vpc.selectSubnets({
                subnetType: SubnetType.PRIVATE_WITH_EGRESS,
            }),
            credentials: Credentials.fromGeneratedSecret("admin"),
            vpc: this.rdsConfig.vpc,
            port: 3306,
            databaseName: "main",
            allocatedStorage: 20,
            instanceIdentifier,
            engine: DatabaseInstanceEngine.mysql({
                version: MysqlEngineVersion.VER_8_0
            }),
            securityGroups: [this.rdsConfig.secretGroup],
            instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
            removalPolicy: RemovalPolicy.DESTROY
        })

        const initializer = new CdkResourceInitializer(this, "MyRdsInit", {
            config: {
                DB_SECRET_ARN: this.rdsConfig.dbServer.secret?.secretArn
            },
            fnLogRetention: RetentionDays.FIVE_DAYS,
            fnCode: DockerImageCode.fromImageAsset(`${__dirname}/rds-init-fn-code`, {}),
            fnTimeout: Duration.minutes(2),
            fnSecurityGroups: [this.rdsConfig.secretGroup],
            vpc: this.rdsConfig.vpc,
            subnetsSelection: this.rdsConfig.vpc.selectSubnets({
                subnetType: SubnetType.PRIVATE_WITH_EGRESS
            })
        })
        // manage resources dependency
        initializer.customResource.node.addDependency(this.rdsConfig.dbServer)

        // allow the initializer function to connect to the RDS instance
        this.rdsConfig.dbServer.connections.allowFrom(initializer.function, Port.tcp(3306))

        this.rdsConfig.dbServer.secret?.grantRead(initializer.function);

        new CfnOutput(this, "ArnDatabaseSecret", {
            value: Token.asString(this.rdsConfig.dbServer.secret?.secretArn)
        })

        new CfnOutput(this, "RdsInitFnResponse", {
            value: Token.asString(initializer.response)
        })
    }
}