import {SignupCognitoUserEvent} from "./SignupCognitoUserEvent";
import {APIGatewayProxyResult, Context} from "aws-lambda";
import * as AWS from "aws-sdk";
const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();

const userPoolId = process.env.USER_POOL_ID!;
const postConfirmationTrigger = process.env.POST_CONFIRMATION_TRIGGER!;

export async function handler(event: SignupCognitoUserEvent, context: Context) : Promise<APIGatewayProxyResult> {

    try {
        console.log("userPoolId: ", process.env.USER_POOL_ID);
        console.log("postConfirmationTrigger: ", process.env.POST_CONFIRMATION_TRIGGER)

        const describeUserPoolResult = await cognitoIdentityServiceProvider.describeUserPool({
            UserPoolId: userPoolId
        }).promise();

        console.log("describeUserPoolResult: ", describeUserPoolResult);

        if (describeUserPoolResult?.UserPool &&
            describeUserPoolResult.UserPool.LambdaConfig) {
            describeUserPoolResult.UserPool.LambdaConfig.PostConfirmation = postConfirmationTrigger;
        } else {
            const message = `Error: operation cannot be performed because result?.UserPool?.LambdaConfig return: ${describeUserPoolResult?.UserPool?.LambdaConfig}`;
            console.error(message);
            return {
                statusCode: describeUserPoolResult.$response.httpResponse.statusCode,
                body: `${describeUserPoolResult.$response.httpResponse.body}`
            }
        }

        console.log("updated describeUserPoolResult.UserPool: ", describeUserPoolResult.UserPool);

        const updateUserPoolResult = await cognitoIdentityServiceProvider.updateUserPool({
            UserPoolId: userPoolId,
            LambdaConfig: describeUserPoolResult.UserPool.LambdaConfig,
            AutoVerifiedAttributes: describeUserPoolResult.UserPool.AutoVerifiedAttributes,
            EmailVerificationMessage: describeUserPoolResult.UserPool.EmailVerificationMessage,
            EmailVerificationSubject: describeUserPoolResult.UserPool.EmailVerificationSubject,
            VerificationMessageTemplate: describeUserPoolResult.UserPool.VerificationMessageTemplate,
            MfaConfiguration: describeUserPoolResult.UserPool.MfaConfiguration,
            EmailConfiguration: describeUserPoolResult.UserPool.EmailConfiguration
        }).promise();

        const $response = updateUserPoolResult.$response;
        if ($response.error) {
            return {
                statusCode: $response.httpResponse.statusCode,
                body: `${$response.httpResponse.body}`
            }
        }
    } catch (e) {
        console.log("Error: ", e);
        return {
            statusCode: 500,
            body: (e as Error).message
        }
    }

    return {
        statusCode: 200,
        body: "Post confirmation trigger has been plugged successfully"
    }
}