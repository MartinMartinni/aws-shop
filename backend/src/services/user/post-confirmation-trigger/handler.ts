import {APIGatewayProxyResult, Context} from "aws-lambda";
import {UserDynamoDBRepository} from "../../repository/UserDynamoDBRepository";
import {UserBankAccountHistoryDynamoDBRepository} from "../../repository/UserBankAccountHistoryDynamoDBRepository";
import {UserBankAccountHistoryEntity, UserRole} from "../../entity/no-sql/Entities";
import {TransferType} from "../../model/Models";
import {SignupCognitoUserEvent} from "./../update-user-pool/SignupCognitoUserEvent";
import {addCorsHeader, getErrorResponse, getResponseFor} from "../../utils/HttpUtils";
import {NotFoundError, RequestValidationError, RequiredFieldRequestValidationError} from "../../exception/Exceptions";

const AWS = require('aws-sdk');

const userDynamoDBRepository = new UserDynamoDBRepository();
const userBankAccountHistoryDynamoDBRepository = new UserBankAccountHistoryDynamoDBRepository();
const userPoolId = process.env.USER_POOL_ID;
const adminGroupName = process.env.ADMIN_GROUP_NAME;

export async function handler(event: SignupCognitoUserEvent, context: Context) : Promise<APIGatewayProxyResult> {
    console.log("event: ", event);

    let response: APIGatewayProxyResult;
    try {
        let userAttributes = event.request.userAttributes;
        if (userAttributes.sub) {
            // @ts-ignore
            let amountOfMoney = parseFloat(userAttributes["custom:amountOfMoney"]);
            if (amountOfMoney < 0) {
                throw new RequestValidationError(`Cannot initialize user with negative amount of money: ${amountOfMoney}`, [], [{
                    name: "amountOfMoney",
                    path: "amountOfMoney"
                }]);
            }

            const role = userAttributes["custom:role"];

            const user = await userDynamoDBRepository.findByEmail(userAttributes.email);
            if (user) {
                response = getResponseFor(200, event);
                context.done(undefined, event);

                addCorsHeader(response);
                return response;
            }

            await userDynamoDBRepository.save({
                id: "",
                sub: userAttributes.sub,
                name: event.userName,
                email: userAttributes.email,
                emailVerified: event.request.userAttributes.email_verified,
                amountOfMoney: amountOfMoney,
                role: role,
                createdAt: ""
            });

            const savedUser = await userDynamoDBRepository.findByEmail(userAttributes.email);

            if (!savedUser) {
                throw new NotFoundError("User", [{
                    name: "email",
                    value: userAttributes.email
                }]);
            }

            if (role === UserRole.ADMIN) {
                const groupParams = {
                    UserPoolId: userPoolId,
                    Username: event.userName,
                    GroupName: adminGroupName,
                };

                console.log("groupParams", groupParams);

                const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();
                await cognitoidentityserviceprovider.adminAddUserToGroup(groupParams).promise();
            }

            await userBankAccountHistoryDynamoDBRepository.save({
                amountOfMoney: amountOfMoney,
                userId: savedUser?.id,
                transferType: TransferType.CREDIT,
            } as UserBankAccountHistoryEntity);

            response = getResponseFor(201, event);
        } else {
            throw new RequiredFieldRequestValidationError([], [{
                name: "sub",
                path: "event.request.userAttributes.sub"
            }]);
        }
    } catch (e) {
        console.error("Error: ", e);

        response = getErrorResponse((e as Error));
    }

    context.done(undefined, event);

    addCorsHeader(response);
    return response;
}