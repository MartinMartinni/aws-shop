import {StackProps} from "aws-cdk-lib";
import {AbstractLambdaStepFunctionCaseStack} from "../../AbstractLambdaStepFunctionCaseStack";
import {Construct} from "constructs";
import {join} from "path";
import {getSuffixFromStack} from "../../../utils/Utils";

export class OrderRevertStepFunctionCaseStack extends AbstractLambdaStepFunctionCaseStack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const suffix = getSuffixFromStack(this);

        this.lambdaInvoke = this.createLambdaInvoke(id, {
            lambdaFunction: this.createLambdaFunction(id, {
                functionName: `order-revert-case-${suffix}`,
                entry: (join(process.cwd(), "src", "services", "step-function", "order", "upstream", "handler.ts"))
            })
        });
    }
}