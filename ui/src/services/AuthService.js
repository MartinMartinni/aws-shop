"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const aws_amplify_1 = require("aws-amplify");
const cdk_outputs_json_1 = require("../../cdk-outputs.json");
const client_cognito_identity_1 = require("@aws-sdk/client-cognito-identity");
const credential_providers_1 = require("@aws-sdk/credential-providers");
class AuthService {
    isAuthorized() {
        return this.user;
    }
    async login(userName, password) {
        try {
            this.user = await aws_amplify_1.Auth.signIn(userName, password);
            AuthService.jwtToken = this.user?.getSignInUserSession()?.getIdToken().getJwtToken();
            console.log("AuthService.jwtToken:", AuthService.jwtToken);
            return this.user;
        }
        catch (error) {
            console.error(error);
            return undefined;
        }
    }
    async logout() {
        await aws_amplify_1.Auth.signOut();
        this.user = undefined;
        AuthService.jwtToken = undefined;
    }
    static async refreshCurrentSession() {
        try {
            const cognitoUserSession = await aws_amplify_1.Auth.currentSession();
            AuthService.jwtToken = cognitoUserSession.getIdToken().getJwtToken();
        }
        catch (e) {
            console.error("Error: ", e);
        }
    }
    async signUp(username, password, email, attributes) {
        try {
            await aws_amplify_1.Auth.signUp({
                username: username,
                password: password,
                attributes: {
                    ...attributes,
                    email: email
                }
            });
        }
        catch (error) {
            console.error("Error signing up:", error);
            throw error;
        }
    }
    async confirmSignUp(email, verificationCode) {
        try {
            await aws_amplify_1.Auth.confirmSignUp(email, verificationCode);
        }
        catch (error) {
            console.error("Error signing up during confirmation:", error);
            throw error;
        }
    }
    getUserName() {
        return this.user?.getUsername();
    }
    async getTemporaryCredentials() {
        if (this.temporaryCredentials) {
            return this.temporaryCredentials;
        }
        this.temporaryCredentials = await this.generateTemporaryCredentials();
        return this.temporaryCredentials;
    }
    async generateTemporaryCredentials() {
        console.log("AuthService.jwtToken:", AuthService.jwtToken);
        console.log("AuthService.awsRegion:", AuthService.awsRegion);
        const cognitoIdentityPool = `cognito-idp.${AuthService.awsRegion}.amazonaws.com/${cdk_outputs_json_1.AuthStack.UserPoolId}`;
        const cognitoIdentity = new client_cognito_identity_1.CognitoIdentityClient({
            credentials: (0, credential_providers_1.fromCognitoIdentityPool)({
                clientConfig: {
                    region: AuthService.awsRegion
                },
                identityPoolId: cdk_outputs_json_1.AuthStack.IdentityPoolId,
                logins: {
                    [cognitoIdentityPool]: AuthService.jwtToken
                }
            })
        });
        const credentials = await cognitoIdentity.config.credentials();
        return credentials;
    }
}
exports.AuthService = AuthService;
AuthService.awsRegion = "eu-central-1";
aws_amplify_1.Amplify.configure({
    Auth: {
        mandatorySignIn: false,
        region: AuthService.awsRegion,
        userPoolId: cdk_outputs_json_1.AuthStack.UserPoolId,
        userPoolWebClientId: cdk_outputs_json_1.AuthStack.UserPoolClientId,
        identityPoolId: cdk_outputs_json_1.AuthStack.IdentityPoolId,
        authenticationFlowType: "USER_PASSWORD_AUTH"
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXV0aFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJBdXRoU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSw2Q0FBNEM7QUFDNUMsNkRBQW1EO0FBQ25ELDhFQUF5RTtBQUN6RSx3RUFBd0U7QUFHeEUsTUFBYSxXQUFXO0lBUWIsWUFBWTtRQUNmLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQztJQUNyQixDQUFDO0lBRU0sS0FBSyxDQUFDLEtBQUssQ0FBQyxRQUFnQixFQUFFLFFBQWdCO1FBQ2pELElBQUk7WUFDQSxJQUFJLENBQUMsSUFBSSxHQUFHLE1BQU0sa0JBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBZ0IsQ0FBQztZQUNqRSxXQUFXLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLEVBQUUsRUFBRSxVQUFVLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNyRixPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixFQUFFLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMzRCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUM7U0FDcEI7UUFBQyxPQUFPLEtBQUssRUFBRTtZQUNaLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDckIsT0FBTyxTQUFTLENBQUE7U0FDbkI7SUFDTCxDQUFDO0lBRU0sS0FBSyxDQUFDLE1BQU07UUFDZixNQUFNLGtCQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDckIsSUFBSSxDQUFDLElBQUksR0FBRyxTQUFTLENBQUM7UUFDdEIsV0FBVyxDQUFDLFFBQVEsR0FBRyxTQUFTLENBQUM7SUFDckMsQ0FBQztJQUVNLE1BQU0sQ0FBQyxLQUFLLENBQUMscUJBQXFCO1FBQ3JDLElBQUk7WUFDQSxNQUFNLGtCQUFrQixHQUFHLE1BQU0sa0JBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUN2RCxXQUFXLENBQUMsUUFB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QUNKLENBQUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHR5cGUgQ29nbml0b1VzZXIgfSBmcm9tIFwiQGF3cy1hbXBsaWZ5L2F1dGhcIjtcclxuaW1wb3J0IHsgQW1wbGlmeSwgQXV0aCB9IGZyb20gXCJhd3MtYW1wbGlmeVwiO1xyXG5pbXBvcnQgeyBBdXRoU3RhY2sgfSBmcm9tIFwiLi4vLi4vY2RrLW91dHB1dHMuanNvblwiO1xyXG5pbXBvcnQgeyBDb2duaXRvSWRlbnRpdHlDbGllbnQgfSBmcm9tICdAYXdzLXNkay9jbGllbnQtY29nbml0by1pZGVudGl0eSc7XHJcbmltcG9ydCB7IGZyb21Db2duaXRvSWRlbnRpdHlQb29sIH0gZnJvbSAnQGF3cy1zZGsvY3JlZGVudGlhbC1wcm92aWRlcnMnO1xyXG5pbXBvcnQge0FXU0NyZWRlbnRpYWxzfSBmcm9tIFwiQGF3cy1hbXBsaWZ5L2FwaS1yZXN0L3NyYy90eXBlc1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIEF1dGhTZXJ2aWNlIHtcclxuXHJcbiAgICBwcml2YXRlIHVzZXI6IENvZ25pdG9Vc2VyIHwgdW5kZWZpbmVkO1xyXG4gICAgcHVibGljIHN0YXRpYyBqd3RUb2tlbjogc3RyaW5nIHwgdW5kZWZpbmVkO1xyXG4gICAgcHVibGljIHJlZnJlc2hUb2tlbjogc3RyaW5nIHwgdW5kZWZpbmVkO1xyXG4gICAgcHJpdmF0ZSB0ZW1wb3JhcnlDcmVkZW50aWFsczogQVdTQ3JlZGVudGlhbHMgfCB1bmRlZmluZWQ7XHJcbiAgICBwdWJsaWMgc3RhdGljIGF3c1JlZ2lvbiA9IFwiZXUtY2VudHJhbC0xXCI7XHJcblxyXG4gICAgcHVibGljIGlzQXV0aG9yaXplZCgpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLnVzZXI7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGFzeW5jIGxvZ2luKHVzZXJOYW1lOiBzdHJpbmcsIHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPENvZ25pdG9Vc2VyIHwgdW5kZWZpbmVkPiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgdGhpcy51c2VyID0gYXdhaXQgQXV0aC5zaWduSW4odXNlck5hbWUsIHBhc3N3b3JkKSBhcyBDb2duaXRvVXNlcjtcclxuICAgICAgICAgICAgQXV0aFNlcnZpY2Uuand0VG9rZW4gPSB0aGlzLnVzZXI/LmdldFNpZ25JblVzZXJTZXNzaW9uKCk/LmdldElkVG9rZW4oKS5nZXRKd3RUb2tlbigpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF1dGhTZXJ2aWNlLmp3dFRva2VuOlwiLCBBdXRoU2VydmljZS5qd3RUb2tlbik7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnVzZXI7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XHJcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWRcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGFzeW5jIGxvZ291dCgpIHtcclxuICAgICAgICBhd2FpdCBBdXRoLnNpZ25PdXQoKTtcclxuICAgICAgICB0aGlzLnVzZXIgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgQXV0aFNlcnZpY2Uuand0VG9rZW4gPSB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBhc3luYyByZWZyZXNoQ3VycmVudFNlc3Npb24oKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgY29nbml0b1VzZXJTZXNzaW9uID0gYXdhaXQgQXV0aC5jdXJyZW50U2Vzc2lvbigpO1xyXG4gICAgICAgICAgICBBdXRoU2VydmljZS5qd3RUb2tlbiA9IGNvZ25pdG9Vc2VyU2Vzc2lvbi5nZXRJZFRva2VuKCkuZ2V0Snd0VG9rZW4oKTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvcjogXCIsIGUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHB1YmxpYyBhc3luYyBzaWduVXAodXNlcm5hbWU6IHN0cmluZywgcGFzc3dvcmQ6IHN0cmluZywgZW1haWw6IHN0cmluZywgYXR0cmlidXRlcz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz4pIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBhd2FpdCBBdXRoLnNpZ25VcCh7XHJcbiAgICAgICAgICAgICAgICB1c2VybmFtZTogdXNlcm5hbWUsXHJcbiAgICAgICAgICAgICAgICBwYXNzd29yZDogcGFzc3dvcmQsXHJcbiAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgLi4uYXR0cmlidXRlcyxcclxuICAgICAgICAgICAgICAgICAgICBlbWFpbDogZW1haWxcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIHNpZ25pbmcgdXA6XCIsIGVycm9yKTtcclxuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcHVibGljIGFzeW5jIGNvbmZpcm1TaWduVXAoZW1haWw6IHN0cmluZywgdmVyaWZpY2F0aW9uQ29kZTogc3RyaW5nKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgYXdhaXQgQXV0aC5jb25maXJtU2lnblVwKGVtYWlsLCB2ZXJpZmljYXRpb25Db2RlKTtcclxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3Igc2lnbmluZyB1cCBkdXJpbmcgY29uZmlybWF0aW9uOlwiLCBlcnJvcik7XHJcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHB1YmxpYyBnZXRVc2VyTmFtZSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy51c2VyPy5nZXRVc2VybmFtZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhc3luYyBnZXRUZW1wb3JhcnlDcmVkZW50aWFscygpIDogUHJvbWlzZTxBV1NDcmVkZW50aWFscz4ge1xyXG4gICAgICAgIGlmICh0aGlzLnRlbXBvcmFyeUNyZWRlbnRpYWxzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnRlbXBvcmFyeUNyZWRlbnRpYWxzO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnRlbXBvcmFyeUNyZWRlbnRpYWxzID0gYXdhaXQgdGhpcy5nZW5lcmF0ZVRlbXBvcmFyeUNyZWRlbnRpYWxzKCk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudGVtcG9yYXJ5Q3JlZGVudGlhbHM7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBnZW5lcmF0ZVRlbXBvcmFyeUNyZWRlbnRpYWxzKCkgOiBQcm9taXNlPEFXU0NyZWRlbnRpYWxzPiB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJBdXRoU2VydmljZS5qd3RUb2tlbjpcIiwgQXV0aFNlcnZpY2Uuand0VG9rZW4pXHJcbiAgICAgICAgY29uc29sZS5sb2coXCJBdXRoU2VydmljZS5hd3NSZWdpb246XCIsIEF1dGhTZXJ2aWNlLmF3c1JlZ2lvbilcclxuICAgICAgICBjb25zdCBjb2duaXRvSWRlbnRpdHlQb29sID0gYGNvZ25pdG8taWRwLiR7QXV0aFNlcnZpY2UuYXdzUmVnaW9ufS5hbWF6b25hd3MuY29tLyR7QXV0aFN0YWNrLlVzZXJQb29sSWR9YDtcclxuICAgICAgICBjb25zdCBjb2duaXRvSWRlbnRpdHkgPSBuZXcgQ29nbml0b0lkZW50aXR5Q2xpZW50KHtcclxuICAgICAgICAgICAgY3JlZGVudGlhbHM6IGZyb21Db2duaXRvSWRlbnRpdHlQb29sKHtcclxuICAgICAgICAgICAgICAgIGNsaWVudENvbmZpZzoge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlZ2lvbjogQXV0aFNlcnZpY2UuYXdzUmVnaW9uXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgaWRlbnRpdHlQb29sSWQ6IEF1dGhTdGFjay5JZGVudGl0eVBvb2xJZCxcclxuICAgICAgICAgICAgICAgIGxvZ2luczoge1xyXG4gICAgICAgICAgICAgICAgICAgIFtjb2duaXRvSWRlbnRpdHlQb29sXTogQXV0aFNlcnZpY2Uuand0VG9rZW4hXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgY29uc3QgY3JlZGVudGlhbHMgPSBhd2FpdCBjb2duaXRvSWRlbnRpdHkuY29uZmlnLmNyZWRlbnRpYWxzKCk7XHJcbiAgICAgICAgcmV0dXJuIGNyZWRlbnRpYWxzIGFzIEFXU0NyZWRlbnRpYWxzO1xyXG4gICAgfVxyXG59XHJcblxyXG5BbXBsaWZ5LmNvbmZpZ3VyZSh7XHJcbiAgICBBdXRoOiB7XHJcbiAgICAgICAgbWFuZGF0b3J5U2lnbkluOiBmYWxzZSxcclxuICAgICAgICByZWdpb246IEF1dGhTZXJ2aWNlLmF3c1JlZ2lvbixcclxuICAgICAgICB1c2VyUG9vbElkOiBBdXRoU3RhY2suVXNlclBvb2xJZCxcclxuICAgICAgICB1c2VyUG9vbFdlYkNsaWVudElkOiBBdXRoU3RhY2suVXNlclBvb2xDbGllbnRJZCxcclxuICAgICAgICBpZGVudGl0eVBvb2xJZDogQXV0aFN0YWNrLklkZW50aXR5UG9vbElkLFxyXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uRmxvd1R5cGU6IFwiVVNFUl9QQVNTV09SRF9BVVRIXCJcclxuICAgIH1cclxufSlcclxuIl19