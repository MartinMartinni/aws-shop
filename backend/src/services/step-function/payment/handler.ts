import {APIGatewayProxyResult} from "aws-lambda";
import {UserDynamoDBRepository} from "../../repository/UserDynamoDBRepository";
import {UserBankAccountHistoryDynamoDBRepository} from "../../repository/UserBankAccountHistoryDynamoDBRepository";
import {Orders} from "../../entity/sql/Orders";
import {createRandomId, parseJSON} from "../../utils/Utils";
import {OrderWorkflowType, TransferType} from "../../model/Models";
import {getResponseFor} from "../../utils/HttpUtils";
import {GeneralException, NotFoundError} from "../../exception/Exceptions";
import {APIGatewayProxyCustomEvent} from "../../model/HttpModels";

const userRepository = new UserDynamoDBRepository();
const userBankAccountHistoryRepository = new UserBankAccountHistoryDynamoDBRepository();

export async function handler(event: APIGatewayProxyCustomEvent): Promise<APIGatewayProxyResult> {

    let parsedBody: any;
    try {
        const body = event.body;

        parsedBody = parseJSON(body);

        const order = parsedBody.order as Orders;

        const user = await userRepository.findById(order.userId);
        if (!user) {
            throw new NotFoundError("User", [{
                name: "id",
                value: order.userId
            }]);
        }

        if (user.amountOfMoney < order.price) {
            return getResponseFor(400, {
                order,
            }, {
                workflowProps: event.workflowProps,
                type: OrderWorkflowType.PAYMENT_ERROR
            })
        }

        await userBankAccountHistoryRepository.save({
            id: createRandomId(),
            transferType: TransferType.DEBIT,
            amountOfMoney: -order.price,
            userId: order.userId,
            createdAt: ""
        })

        user.amountOfMoney -= order.price;
        await userRepository.save(user);

        return getResponseFor(200, {
            ...parsedBody,
            order,
        }, {
            workflowProps: event.workflowProps,
            type: OrderWorkflowType.PAYMENT_SUCCESS
        })

    } catch (e) {
        console.error("Error: ", e);

        throw new GeneralException((e as Error), {
            ...event.workflowProps
        });
    }
}