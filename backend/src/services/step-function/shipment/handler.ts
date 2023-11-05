import {APIGatewayProxyResult} from "aws-lambda";
import {ShipmentDynamoDBRepository} from "../../repository/ShipmentDynamoDBRepository";
import {Orders} from "../../entity/sql/Orders";
import {ShipmentEntity} from "../../entity/no-sql/Entities";
import {OrderWorkflowType} from "../../model/Models";
import {getResponseFor} from "../../utils/HttpUtils";
import {parseJSON} from "../../utils/Utils";
import {GeneralException} from "../../exception/Exceptions";
import {APIGatewayProxyCustomEvent} from "../../model/HttpModels";

const shipmentRepository = new ShipmentDynamoDBRepository();

export async function handler(event: APIGatewayProxyCustomEvent): Promise<APIGatewayProxyResult> {

    let parsedBody: any;
    try {
        const body = event.body;

        parsedBody = parseJSON(body);
        const order = parsedBody.order as Orders;

        const address = order.address;
        const shipmentEntity = {
            ...address,
            id: "",
            orderId: order.id
        } as ShipmentEntity;

        await shipmentRepository.save(shipmentEntity);

        return getResponseFor(200, {
            order: order
        }, {
            workflowProps: event.workflowProps,
            type: OrderWorkflowType.SHIPMENT_SUCCESS
        });
    } catch (e) {
        console.error("Error: ", e);

        throw new GeneralException((e as Error), {
            ...event.workflowProps
        });

    }
}