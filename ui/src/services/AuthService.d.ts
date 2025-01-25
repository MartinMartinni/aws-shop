import { type CognitoUser } from "@aws-amplify/auth";
import { AWSCredentials } from "@aws-amplify/api-rest/src/types";
export declare class AuthService {
    private user;
    static jwtToken: string | undefined;
    refreshToken: string | undefined;
    private temporaryCredentials;
    static awsRegion: string;
    isAuthorized(): CognitoUser | undefined;
    login(userName: string, password: string): Promise<CognitoUser | undefined>;
    logout(): Promise<void>;
    static refreshCurrentSession(): Promise<void>;
    signUp(username: string, password: string, email: string, attributes?: Record<string, string>): Promise<void>;
    confirmSignUp(email: string, verificationCode: string): Promise<void>;
    getUserName(): string | undefined;
    getTemporaryCredentials(): Promise<AWSCredentials>;
    private generateTemporaryCredentials;
}
