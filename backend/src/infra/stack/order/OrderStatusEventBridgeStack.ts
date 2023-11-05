import * as events from 'aws-cdk-lib/aws-events';
import {Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {getSuffixFromStack} from "../utils/Utils";

export class OrderStatusEventBridgeStack extends Stack {
    public readonly eventBus: events.EventBus;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const suffix = getSuffixFromStack(this);

        this.eventBus = new events.EventBus(this, 'OrderStatusEventBridge', {
            eventBusName: `order-status-${suffix}`,
        });
    }
}