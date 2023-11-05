import {RemovalPolicy, Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {AttributeType, ITable, Table} from "aws-cdk-lib/aws-dynamodb";
import {getSuffixFromStack} from "../utils/Utils";

export class UserDataStack extends Stack {
    public readonly userTable: ITable;
    public readonly userBankAccountHistoryTable: ITable;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const suffix = getSuffixFromStack(this);

        this.userTable = new Table(this, "UserTable", {
            partitionKey: {
                name: "id",
                type: AttributeType.STRING
            },
            tableName: `user-${suffix}`,
            removalPolicy: RemovalPolicy.DESTROY
        });

        this.userBankAccountHistoryTable = new Table(this, "UserCreditBankAccountHistoryTable", {
            partitionKey: {
                name: "id",
                type: AttributeType.STRING
            },
            tableName: `user-credit-bank-account-history-${suffix}`,
            removalPolicy: RemovalPolicy.DESTROY
        });
    }
}