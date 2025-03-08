import {Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {UserDataStack} from "./UserDataStack";
import {UserLambdaStack} from "./UserLambdaStack";
import {ITable} from "aws-cdk-lib/aws-dynamodb";
import {UserCreditBankAccountLambdaStack} from "./UserCreditBankAccountLambdaStack";
import {LambdaIntegration} from "aws-cdk-lib/aws-apigateway";
import {UserPool} from "aws-cdk-lib/aws-cognito";
import {UserPostConfirmationTriggerLambdaStack} from "./UserPostConfirmationTriggerLambdaStack";
import {UserPreSignUpTriggerLambdaStack} from "./UserPreSignUpTriggerLambdaStack";
import {UpdateUserPoolStack} from "./UpdateUserPoolStack";

export interface UserStackProps extends StackProps {
    userPool: UserPool
}

export class UserStack extends Stack {

    public readonly userTable: ITable;
    public readonly userBankAccountHistoryTable: ITable;
    public readonly userCreditBankAccountLambdaIntegration: LambdaIntegration;
    public readonly userLambdaIntegration: LambdaIntegration;
    public readonly updateUserPoolStack: UpdateUserPoolStack;

    constructor(scope: Construct, id: string, props: UserStackProps) {
        super(scope, id, props);

        const userDataStack = new UserDataStack(this, "UserDataStack");
        this.userTable = userDataStack.userTable;
        this.userBankAccountHistoryTable = userDataStack.userBankAccountHistoryTable;

        const userLambdaStack = new UserLambdaStack(this, "UserLambdaStack", {
            userTable: this.userTable,
            userCreditBankAccountTable: this.userBankAccountHistoryTable
        });

        const userPreSignUpTriggerLambdaStack = new UserPreSignUpTriggerLambdaStack(this, "UserPreSignUpTriggerLambdaStack", {
            userPool: props.userPool
        });

        const userPostConfirmationTriggerLambdaStack = new UserPostConfirmationTriggerLambdaStack(this, "UserPostConfirmationTriggerLambdaStack", {
            userTable: this.userTable,
            userCreditBankAccountTable: this.userBankAccountHistoryTable,
            userPool: props.userPool
        });

        this.updateUserPoolStack = new UpdateUserPoolStack(this, "UpdateUserPoolStack", {
            userPool: props.userPool,
            postConfirmationLambdaFunction: userPostConfirmationTriggerLambdaStack.postConfirmationLambdaFunction,
            preSignUpLambdaFunction: userPreSignUpTriggerLambdaStack.preSignUpLambdaFunction
        })

        const userCreditBankAccountLambdaStack = new UserCreditBankAccountLambdaStack(this, "UserCreditBankAccountLambdaStack", {
            userCreditBankAccountTable: this.userBankAccountHistoryTable
        });

        this.userCreditBankAccountLambdaIntegration = new LambdaIntegration(userCreditBankAccountLambdaStack.lambdaFunction);
        this.userLambdaIntegration = new LambdaIntegration(userLambdaStack.lambdaFunction);
    }
}