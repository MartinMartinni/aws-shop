import {UserRole} from "../../entity/no-sql/Entities";

interface SignupCognitoUserRequestUserAttributesEvent {
    email: string,
    email_verified: boolean,
    name: string,
    sub: string,
    "custom:amountOfMoney": number,
    "custom:role": UserRole
}

interface SignupCognitoUserRequestEvent {
    userAttributes: SignupCognitoUserRequestUserAttributesEvent
}

export interface SignupCognitoUserEvent {
    userName: string,
    request: SignupCognitoUserRequestEvent,
    response: any
}