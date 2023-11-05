import {Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {WarehouseStepFunctionCaseStack} from "./warehouse/downstream/WarehouseStepFunctionCaseStack";
import {WarehouseRevertStepFunctionCaseStack} from "./warehouse/upstream/WarehouseRevertStepFunctionCaseStack";
import {PaymentStepFunctionCaseStack} from "./payment/PaymentStepFunctionCaseStack";
import {ShipmentStepFunctionCaseStack} from "./shipment/ShipmentStepFunctionCaseStack";
import {
    Choice,
    Condition,
    DefinitionBody,
    JsonPath, Parallel,
    StateMachine,
    TaskInput
} from "aws-cdk-lib/aws-stepfunctions";
import {OrderFinalizationStepFunctionCaseStack} from "./order/downstream/OrderFinalizationStepFunctionCaseStack";
import {OrderStepFunctionCaseStack} from "./order/downstream/OrderStepFunctionCaseStack";
import {ITable} from "aws-cdk-lib/aws-dynamodb";
import {EventBridgePutEvents} from "aws-cdk-lib/aws-stepfunctions-tasks";
import {EventBus} from "aws-cdk-lib/aws-events";
import {OrderWorkflowType} from "../../../services/model/Models";
import {RdsConfig} from "../../../../docker/db-init/RdsInitStack";

interface StepFunctionOrderWorkflowStackProps extends StackProps {
    productTable: ITable
    productSoldTable: ITable
    userTable: ITable
    userBankAccountHistoryTable: ITable,
    eventBus: EventBus,
    rdsConfig: RdsConfig
}
export class StepFunctionOrderWorkflowStack extends Stack {

    public readonly stateMachine: StateMachine;
    public readonly orderFinalizationStack: OrderFinalizationStepFunctionCaseStack;
    constructor(scope: Construct, id: string, props: StepFunctionOrderWorkflowStackProps) {
        super(scope, id, props);

        const orderStack = new OrderStepFunctionCaseStack(this, "OrderStepFunctionCaseStack", {
            userTable: props.userTable,
            productTable: props.productTable,
            rdsConfig: props.rdsConfig
        });
        this.orderFinalizationStack = new OrderFinalizationStepFunctionCaseStack(this, "OrderFinalizationStepFunctionCaseStack", {
            rdsConfig: props.rdsConfig
        });

        const warehouseStack = new WarehouseStepFunctionCaseStack(this, "WarehouseStepFunctionCaseStack", {
            productTable: props.productTable,
            productSoldTable: props.productSoldTable
        });
        const warehouseRevertStack = new WarehouseRevertStepFunctionCaseStack(this, "WarehouseRevertStepFunctionCaseStack", {
            productTable: props.productTable,
            productSoldTable: props.productSoldTable
        });

        const paymentStack = new PaymentStepFunctionCaseStack(this, "PaymentStepFunctionCaseStack", {
            userTable: props.userTable,
            userBankAccountHistoryTable: props.userBankAccountHistoryTable
        });

        const shipmentStack = new ShipmentStepFunctionCaseStack(this, "ShipmentStepFunctionCaseStack");

        const putEventTask = new EventBridgePutEvents(this, 'EventBridgePutEvents', {
            entries: [{
                detail: TaskInput.fromObject({
                    Message: JsonPath.stringAt('$'),
                }),
                eventBus: props.eventBus,
                detailType: 'MessageFromStepFunctions',
                source: 'step.functions',
            }],
        });

        const orderFinalizationCase = this.orderFinalizationStack.getLambdaInvoke();
        const warehouseRevertCase = warehouseRevertStack.getLambdaInvoke();
        const finalizationCase = orderFinalizationCase
            .next(putEventTask);

        const parallelChain = new Parallel(this, "StateMachineOrderWorkflowParallel")
            .branch(orderStack.getLambdaInvoke()
                .next(warehouseStack.getLambdaInvoke())
                .next(paymentStack.getLambdaInvoke())
                .next(new Choice(this, "PaymentSuccess")
                    .when(Condition.stringEquals("$.type", OrderWorkflowType.PAYMENT_SUCCESS),
                        shipmentStack.getLambdaInvoke())
                    .when(Condition.stringEquals("$.type", OrderWorkflowType.PAYMENT_ERROR),
                        warehouseRevertCase)
            ))
            .addCatch(finalizationCase)
            .next(finalizationCase);

        this.stateMachine = new StateMachine(this, "StateMachineOrderWorkflow", {
            definitionBody: DefinitionBody.fromChainable(parallelChain)
        });

        props.eventBus.grantPutEventsTo(this.stateMachine);
    }

}