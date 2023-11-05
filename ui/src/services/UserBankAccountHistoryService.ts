import {RestApiStack} from "../../cdk-outputs.json";
import {AbstractService} from "./AbstractService.ts";
import {UserBankAccountHistory} from "../model/Models.ts";
import {HttpService} from "./HttpService.ts";
export class UserBankAccountHistoryService extends AbstractService<UserBankAccountHistory> {
    constructor() {
        super(RestApiStack.RestApiEndpoint0551178A + "user-credit-bank-account")
    }
    public async findAllByUserId(userId: string) : Promise<UserBankAccountHistory[]> {
        try {
            const result = await HttpService.fetch(`${this.url}?userId=${userId}`, {
                method: "GET",
            });
            return await result.json() as UserBankAccountHistory[];
        } catch (e) {
            console.error("Error: ", e);
            return [];
        }
    }
}