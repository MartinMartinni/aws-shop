import { AuthService } from "./AuthService.ts";
export declare class HttpService {
    static jwtToken: string | undefined;
    static authService: AuthService;
    static resetToken(): void;
    static setJwtToken(jwtToken: string | undefined): void;
    static fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
    private static retryWithNewToken;
}
