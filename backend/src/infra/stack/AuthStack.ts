import {CfnOutput, RemovalPolicy, Stack, StackProps} from "aws-cdk-lib"
import {
    CfnIdentityPool,
    CfnIdentityPoolRoleAttachment,
    CfnUserPoolGroup,
    StringAttribute,
    UserPool,
    UserPoolClient
} from "aws-cdk-lib/aws-cognito";
import {Effect, FederatedPrincipal, PolicyStatement, Role} from "aws-cdk-lib/aws-iam";
import {Construct} from "constructs";
import {ICustomAttribute} from "aws-cdk-lib/aws-cognito/lib/user-pool-attr";
import {IBucket} from "aws-cdk-lib/aws-s3";

interface AuthStackProps extends StackProps {
    photoBucket: IBucket
}

export class AuthStack extends Stack {

    public static ADMIN_GROUP_NAME = "admins";
    public userPool: UserPool;
    private userPoolClient: UserPoolClient;
    private identityPool: CfnIdentityPool;
    private authenticatedRole: Role;
    private unAuthenticatedRole: Role;
    private adminRole: Role;

    constructor(scope: Construct, id: string, props: AuthStackProps) {
        super(scope, id, props);

        this.createUserPool();
        this.createUserPoolClient();
        this.createIdentityPool();
        this.createRoles(props.photoBucket);
        this.attachRoles();
        this.createAdminsGroup();
    }

    private createUserPool(){
        const customAttributes: { [key: string]: ICustomAttribute } = {
            "role": new StringAttribute({ mutable: true }),
            "amountOfMoney": new StringAttribute({ mutable: true }),
            "img": new StringAttribute({ mutable: true })
        };

        this.userPool = new UserPool(this, "UserPool", {
            selfSignUpEnabled: true,
            signInAliases: {
                username: true,
                email: true
            },
            customAttributes,
            removalPolicy: RemovalPolicy.DESTROY
        });

        new CfnOutput(this, "UserPoolId", {
            value: this.userPool.userPoolId
        });
    }
    private createUserPoolClient(){
        this.userPoolClient = this.userPool.addClient("UserPoolClient", {
            authFlows: {
                adminUserPassword: true,
                custom: true,
                userPassword: true,
                userSrp: true
            }
        });
        new CfnOutput(this, "UserPoolClientId", {
            value: this.userPoolClient.userPoolClientId
        })
    }

    private createAdminsGroup(){
        new CfnUserPoolGroup(this, "Admins", {
            userPoolId: this.userPool.userPoolId,
            groupName: AuthStack.ADMIN_GROUP_NAME,
            roleArn: this.adminRole.roleArn
        })
    }

    private createIdentityPool(){
        this.identityPool = new CfnIdentityPool(this, "IdentityPool", {
            allowUnauthenticatedIdentities: true,
            cognitoIdentityProviders: [{
                clientId: this.userPoolClient.userPoolClientId,
                providerName: this.userPool.userPoolProviderName
            }]
        })
        new CfnOutput(this, "IdentityPoolId", {
            value: this.identityPool.ref
        })
    }
    private createRoles(photosBucket: IBucket){
        this.authenticatedRole = new Role(this, "CognitoDefaultAuthenticatedRole", {
            assumedBy: new FederatedPrincipal("cognito-identity.amazonaws.com", {
                    StringEquals: {
                        "cognito-identity.amazonaws.com:aud": this.identityPool.ref
                    },
                    "ForAnyValue:StringLike": {
                        "cognito-identity.amazonaws.com:amr": "authenticated"
                    }
                },
                "sts:AssumeRoleWithWebIdentity"
            )
        });
        this.unAuthenticatedRole = new Role(this, "CognitoDefaultUnauthenticatedRole", {
            assumedBy: new FederatedPrincipal("cognito-identity.amazonaws.com", {
                    StringEquals: {
                        "cognito-identity.amazonaws.com:aud": this.identityPool.ref
                    },
                    "ForAnyValue:StringLike": {
                        "cognito-identity.amazonaws.com:amr": "unauthenticated"
                    }
                },
                "sts:AssumeRoleWithWebIdentity"
            )
        });
        this.adminRole = new Role(this, "CognitoAdminRole", {
            assumedBy: new FederatedPrincipal("cognito-identity.amazonaws.com", {
                    StringEquals: {
                        "cognito-identity.amazonaws.com:aud": this.identityPool.ref
                    },
                    "ForAnyValue:StringLike": {
                        "cognito-identity.amazonaws.com:amr": "authenticated"
                    }
                },
                "sts:AssumeRoleWithWebIdentity"
            )
        });
        this.adminRole.addToPolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
                "s3:PutObject",
                "s3:PutObjectAcl",
            ],
            resources: [
                photosBucket.bucketArn,
                photosBucket.bucketArn + "/*"
            ]
        }))
    }

    private attachRoles(){
        new CfnIdentityPoolRoleAttachment(this, "RolesAttachment", {
            identityPoolId: this.identityPool.ref,
            roles: {
                "authenticated": this.authenticatedRole.roleArn,
                "unauthenticated": this.unAuthenticatedRole.roleArn
            },
            roleMappings: {
                adminsMapping: {
                    type: "Token",
                    ambiguousRoleResolution: "AuthenticatedRole",
                    identityProvider: `${this.userPool.userPoolProviderName}:${this.userPoolClient.userPoolClientId}`
                }
            }
        })
    }
}