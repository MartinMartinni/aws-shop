import {User} from "../model/Models.ts";

import {RestApiStack} from "../../cdk-outputs.json";
import {AuthService} from "./AuthService.ts";
import {HttpService} from "./HttpService.ts";

const userUrl = RestApiStack.RestApiEndpoint0551178A + "users";
export class UserService {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    private user: User | undefined;
    private authService: AuthService;
    constructor(authService: AuthService) {
        this.authService = authService;
    }


    public async getUser() : Promise<User | undefined> {
        try {
            console.log("this.authService.getUserName()", this.authService.getUserName());
            const result = await fetch(`${userUrl}?email=${this.authService.getUserName()}`, {
                method: "GET",
                headers: {
                    "Authorization": AuthService.jwtToken!
                }
            });
            this.user = await result.json() as User;
        } catch (e) {
            console.error("Error: ", e);
            this.user = undefined;
        }

        return this.user;
    }

    public async updateAmountOfMoney(userId:string, amountOfMoney: number) : Promise<void> {
        try {
            const result = await HttpService.fetch(`${userUrl}?userId=${userId}`, {
                method: "PATCH",
                body: JSON.stringify({
                    amountOfMoney
                })
            })

            return await result.json();
        } catch (e) {
            console.error("Error: ", e);
            throw e;
        }
    }
}