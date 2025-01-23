import {UserRole} from "../../entity/no-sql/Entities";

interface PreSignupCognitoUserRequestUserAttributesEvent {
    email: string
    // email_verified: boolean,
    // name: string,
    // sub: string,
    "custom:amountOfMoney": number,
    "custom:role": UserRole,
    "custom:domain": string
}

interface PreSignupCognitoUserRequestUserValidationDataEvent {

}

interface PreSignupCognitoUserRequestUserClientMetadataEvent {
    
}
 
interface PreSignupCognitoUserRequestEvent {
    userAttributes: PreSignupCognitoUserRequestUserAttributesEvent,
    validationData: PreSignupCognitoUserRequestUserValidationDataEvent,
    clientMetadata: PreSignupCognitoUserRequestUserClientMetadataEvent
}

interface PreSignupCognitoUserResponseEvent {
    autoConfirmUser: boolean,
    autoVerifyPhone: boolean,
    autoVerifyEmail: boolean
}

export interface PreSignupCognitoUserEvent {
    request: PreSignupCognitoUserRequestEvent,
    response: PreSignupCognitoUserResponseEvent
}