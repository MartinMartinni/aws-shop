import {APIGatewayProxyResult, Context} from "aws-lambda";
import {addCorsHeader, getErrorResponse, getResponseFor} from "../../utils/HttpUtils";
import {PreSignupCognitoUserEvent} from "./PreSignupCognitoUserEvent";

export async function handler(event: PreSignupCognitoUserEvent, context: Context) : Promise<APIGatewayProxyResult> {
    console.log("event: ", event);

    let response: APIGatewayProxyResult;
    try {
        event.response.autoConfirmUser = false;

        // Split the email address so we can compare domains
        var address = event.request.userAttributes.email.split("@");

        // This example uses a custom attribute "custom:domain"
        if (event.request.userAttributes.hasOwnProperty("custom:domain")) {
            if (event.request.userAttributes["custom:domain"] === address[1]) {
                event.response.autoConfirmUser = true;
                event.response.autoVerifyEmail = true;
            }
        }

        console.log("eventResponse: ", event);
        response = getResponseFor(200, event);
    } catch (e) {
        console.error("Error: ", e);

        response = getErrorResponse((e as Error));
    }

    context.done(undefined, event);

    addCorsHeader(response);
    return response;
}