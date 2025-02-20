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
import {OrderFinalizationStepFunctionCaseRDSStack} from "./order/downstream/rds/OrderFinalizationStepFunctionCaseRDSStack";
import {OrderStepFunctionCaseRDSStack} from "./order/downstream/rds/OrderStepFunctionCaseRDSStack";
import {OrderFinalizationStepFunctionCaseDynamoStack} from "./order/downstream/dynamo/OrderFinalizationStepFunctionCaseDynamoStack";
import {OrderStepFunctionCaseDynamoStack} from "./order/downstream/dynamo/OrderStepFunctionCaseDynamoStack";
import {ITable} from "aws-cdk-lib/aws-dynamodb";
import {EventBridgePutEvents} from "aws-cdk-lib/aws-stepfunctions-tasks";
import {EventBus} from "aws-cdk-lib/aws-events";
import {OrderWorkflowType} from "../../../services/model/Models";
import {RdsConfig} from "../../../../docker/db-init/RdsInitStack";
import {AbstractLambdaStepFunctionCaseStack} from "./AbstractLambdaStepFunctionCaseStack";
import {AbstractOrderFinalizationStepFunctionCaseStack} from "./AbstractOrderFinalizationStepFunctionCaseStack";

interface StepFunctionOrderWorkflowStackProps extends StackProps {
    productTable: ITable
    productSoldTable: ITable
    userTable: ITable
    userBankAccountHistoryTable: ITable,
    eventBus: EventBus,
    rdsConfig: RdsConfig | undefined,
    orderTable: ITable | undefined
}
export class StepFunctionOrderWorkflowStack extends Stack {

    public readonly stateMachine: StateMachine;
    public readonly orderFinalizationStack: AbstractOrderFinalizationStepFunctionCaseStack;
    
    constructor(scope: Construct, id: string, props: StepFunctionOrderWorkflowStackProps) {
        super(scope, id, props);

        const ordersDBType = process.env.ORDERS_DB_TYPE?.toUpperCase() || "DYNAMO";

        let orderStack: AbstractLambdaStepFunctionCaseStack;

        if (ordersDBType === "RDS") {
            orderStack = new OrderStepFunctionCaseRDSStack(this, "OrderStepFunctionCaseRDSStack", {
                userTable: props.userTable,
                productTable: props.productTable,
                rdsConfig: props.rdsConfig!
            });

            this.orderFinalizationStack = new OrderFinalizationStepFunctionCaseRDSStack(this, "OrderFinalizationStepFunctionCaseRDSStack", {
                rdsConfig: props.rdsConfig!
            });
        } else {
            orderStack = new OrderStepFunctionCaseDynamoStack(this, "OrderStepFunctionCaseDynamoStack", {
                userTable: props.userTable,
                productTable: props.productTable,
                orderTable: props.orderTable!
            });

            this.orderFinalizationStack = new OrderFinalizationStepFunctionCaseDynamoStack(this, "OrderFinalizationStepFunctionCaseDynamoStack", {
                orderTable: props.orderTable!
            });
        }

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