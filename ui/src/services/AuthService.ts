import { type CognitoUser } from "@aws-amplify/auth";
import { Amplify, Auth } from "aws-amplify";
import { AuthStack } from "../../cdk-outputs.json";
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';
import {AWSCredentials} from "@aws-amplify/api-rest/src/types";

export class AuthService {

    private user: CognitoUser | undefined;
    public static jwtToken: string | undefined;
    public refreshToken: string | undefined;
    private temporaryCredentials: AWSCredentials | undefined;
    public static awsRegion = "eu-central-1";

    public isAuthorized(){
        return this.user;
    }

    public async login(userName: string, password: string): Promise<CognitoUser | undefined> {
        try {
            this.user = await Auth.signIn(userName, password) as CognitoUser;
            AuthService.jwtToken = this.user?.getSignInUserSession()?.getIdToken().getJwtToken();
            console.log("AuthService.jwtToken:", AuthService.jwtToken);
            return this.user;
        } catch (error) {
            console.error(error);
            return undefined
        }
    }

    public async logout() {
        await Auth.signOut();
        this.user = undefined;
        AuthService.jwtToken = undefined;
    }

    public static async refreshCurrentSession() {
        try {
            const cognitoUserSession = await Auth.currentSession();
            AuthService.jwtToken = cognitoUserSession.getIdToken().getJwtToken();
        } catch (e) {
            console.error("Error: ", e);
        }
    }
    public async signUp(username: string, password: string, email: string, attributes?: Record<string, string>) {
        try {
            await Auth.signUp({
                username: username,
                password: password,
                attributes: {
                    ...attributes,
                    email: email
                }
            });
        } catch (error) {
            console.error("Error signing up:", error);
            throw error;
        }
    }
    public async confirmSignUp(email: string, verificationCode: string) {
        try {
            await Auth.confirmSignUp(email, verificationCode);
        } catch (error) {
            console.error("Error signing up during confirmation:", error);
            throw error;
        }
    }
    public getUserName() {
        return this.user?.getUsername();
    }

    public async getTemporaryCredentials() : Promise<AWSCredentials> {
        if (this.temporaryCredentials) {
            return this.temporaryCredentials;
        }
        this.temporaryCredentials = await this.generateTemporaryCredentials();
        return this.temporaryCredentials;
    }

    private async generateTemporaryCredentials() : Promise<AWSCredentials> {
        console.log("AuthService.jwtToken:", AuthService.jwtToken)
        console.log("AuthService.awsRegion:", AuthService.awsRegion)
        const cognitoIdentityPool = `cognito-idp.${AuthService.awsRegion}.amazonaws.com/${AuthStack.UserPoolId}`;
        const cognitoIdentity = new CognitoIdentityClient({
            credentials: fromCognitoIdentityPool({
                clientConfig: {
                    region: AuthService.awsRegion
                },
                identityPoolId: AuthStack.IdentityPoolId,
                logins: {
                    [cognitoIdentityPool]: AuthService.jwtToken!
                }
            })
        });
        const credentials = await cognitoIdentity.config.credentials();
        return credentials as AWSCredentials;
    }
}

Amplify.configure({
    Auth: {
        mandatorySignIn: false,
        region: AuthService.awsRegion,
        userPoolId: AuthStack.UserPoolId,
        userPoolWebClientId: AuthStack.UserPoolClientId,
        identityPoolId: AuthStack.IdentityPoolId,
        authenticationFlowType: "USER_PASSWORD_AUTH"
    }
})
