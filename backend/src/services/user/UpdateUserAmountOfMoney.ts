import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";
import {parseJSON} from "../utils/Utils";
import {TransferType, UserCreditBankAccountEntry} from "../model/Models";
import {validateAsUserCreditBankAccountEntry} from "../validators/Validators";
import {UserBankAccountHistoryDynamoDBRepository} from "../repository/UserBankAccountHistoryDynamoDBRepository";
import {UserDynamoDBRepository} from "../repository/UserDynamoDBRepository";
import {
    NotFoundError,
    RequestValidationError,
    RequiredFieldRequestValidationError
} from "../exception/Exceptions";
import {getResponseFor} from "../utils/HttpUtils";

const userBankAccountHistoryDynamoDBRepository = new UserBankAccountHistoryDynamoDBRepository()

export async function updateUserAmountOfMoney(event: APIGatewayProxyEvent, userDynamoDBRepository: UserDynamoDBRepository): Promise<APIGatewayProxyResult> {

    const body = event.body;

    if (!event.queryStringParameters || !event.queryStringParameters["userId"]) {
        throw new RequiredFieldRequestValidationError(["userId"], []);
    }

    const userId = event.queryStringParameters["userId"];

    const userCreditBankAccount = parseJSON(body || "{}") as UserCreditBankAccountEntry;
    validateAsUserCreditBankAccountEntry(userCreditBankAccount);

    let transferType = TransferType.CREDIT
    if (userCreditBankAccount.amountOfMoney < 0) {
        transferType = TransferType.DEBIT
    }

    const user = await userDynamoDBRepository.findById(userId);

    if (!user) {
        throw new NotFoundError("User", [{
            name: "userId",
            value: `${userId}`
        }]);
    }

    const amountOfMoney = transferType == TransferType.CREDIT
        ? user.amountOfMoney + (userCreditBankAccount.amountOfMoney)
        : user.amountOfMoney - Math.abs(userCreditBankAccount.amountOfMoney);

    if (amountOfMoney < 0) {
        throw new RequestValidationError("You cannot withdraw more money from your account than you have.", [], [{
            name: "amountOfMoney",
            path: "amountOfMoney"
        }]);
    }

    await userBankAccountHistoryDynamoDBRepository.save({
        id: "",
        userId: userId,
        amountOfMoney: userCreditBankAccount.amountOfMoney,
        transferType: transferType,
        createdAt: new Date().toISOString()
    });

    await userDynamoDBRepository.updateFields(userId, {amountOfMoney: amountOfMoney});

    return getResponseFor(200, {
        message: "Account has been updated successfully"
    });
}