import {AuthService} from "./AuthService.ts";
import {HttpError} from "../exceptions/Exceptions.ts";

export class HttpService {

    public static jwtToken: string | undefined;
    public static authService: AuthService;


    public static resetToken() {
        this.jwtToken = undefined;
        localStorage.removeItem("jwtToken");
    }

    public static setJwtToken(jwtToken: string | undefined) {
        this.jwtToken = jwtToken;
        localStorage.setItem("jwtToken", this.jwtToken || "");
    }

    public static async fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        let response: Response;
        try {
            const jwtToken = this.jwtToken || localStorage.getItem("jwtToken");
            const initWithToken = {
                ...init,
                headers: {
                    ...init?.headers,
                    Authorization: jwtToken
                }
            } as RequestInit;

            console.log(`input: ${input} \ninit: ${init}`);
            response = await fetch(input, initWithToken);

            if (response.status == 401) {
                response = await this.retryWithNewToken(input, initWithToken);
            }

            if (response.status == 400) {
                throw new HttpError(response);
            }

            // console.log("response: ", response);
            return response;
        } catch (e) {
            console.error("Error: ", e);
            throw e;
        }
    }

    private static async retryWithNewToken(input: Request | string | URL, initWithToken: RequestInit) {
        console.log("Retry fetch");
        await AuthService.refreshCurrentSession();
        this.setJwtToken(AuthService.jwtToken);
        return await fetch(input, initWithToken);
    }
}