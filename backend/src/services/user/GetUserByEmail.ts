import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";
import {UserDynamoDBRepository} from "../repository/UserDynamoDBRepository";
import {NotFoundError, RequiredFieldRequestValidationError} from "../exception/Exceptions";
import {getResponseFor} from "../utils/HttpUtils";

export async function getUserByEmail(event: APIGatewayProxyEvent, userDynamoDBRepository: UserDynamoDBRepository): Promise<APIGatewayProxyResult> {

    if (!event.queryStringParameters || !event.queryStringParameters["email"]) {
        throw new RequiredFieldRequestValidationError(["email"], []);
    }

    const email = event.queryStringParameters["email"];
    const user = await userDynamoDBRepository.findByEmail(email);

    if (!user) {
        throw new NotFoundError("User", [{
            name: "email",
            value: email
        }])
    }

    return getResponseFor(200, user);
}