"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpService = void 0;
const AuthService_ts_1 = require("./AuthService.ts");
const Exceptions_ts_1 = require("../exceptions/Exceptions.ts");
class HttpService {
    static resetToken() {
        this.jwtToken = undefined;
        localStorage.removeItem("jwtToken");
    }
    static setJwtToken(jwtToken) {
        this.jwtToken = jwtToken;
        localStorage.setItem("jwtToken", this.jwtToken || "");
    }
    static async fetch(input, init) {
        let response;
        try {
            const jwtToken = this.jwtToken || localStorage.getItem("jwtToken");
            const initWithToken = {
                ...init,
                headers: {
                    ...init?.headers,
                    Authorization: jwtToken
                }
            };
            console.log(`input: ${input} \ninit: ${init}`);
            response = await fetch(input, initWithToken);
            if (response.status == 401) {
                response = await this.retryWithNewToken(input, initWithToken);
            }
            if (response.status == 400) {
                throw new Exceptions_ts_1.HttpError(response);
            }
            console.log("response: ", response);
            return response;
        }
        catch (e) {
            console.error("Error: ", e);
            throw e;
        }
    }
    static async retryWithNewToken(input, initWithToken) {
        console.log("Retry fetch");
        await AuthService_ts_1.AuthService.refreshCurrentSession();
        this.setJwtToken(AuthService_ts_1.AuthService.jwtToken);
        return await fetch(input, initWithToken);
    }
}
exports.HttpService = HttpService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSHR0cFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJIdHRwU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxREFBNkM7QUFDN0MsK0RBQXNEO0FBRXRELE1BQWEsV0FBVztJQU1iLE1BQU0sQ0FBQyxVQUFVO1FBQ3BCLElBQUksQ0FBQyxRQUFRLEdBQUcsU0FBUyxDQUFDO1FBQzFCLFlBQVksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDeEMsQ0FBQztJQUVNLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBNEI7UUFDbEQsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFDekIsWUFBWSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFFBQVEsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUMxRCxDQUFDO0lBRU0sTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBd0IsRUFBRSxJQUFrQjtRQUNsRSxJQUFJLFFBQWtCLENBQUM7UUFDdkIsSUFBSTtZQUNBLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLElBQUksWUFBWSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNuRSxNQUFNLGFBQWEsR0FBRztnQkFDbEIsR0FBRyxJQUFJO2dCQUNQLE9BQU8sRUFBRTtvQkFDTCxHQUFHLElBQUksRUFBRSxPQUFPO29CQUNoQixhQUFhLEVBQUUsUUFBUTtpQkFDMUI7YUFDVyxDQUFDO1lBRWpCLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxLQUFLLFlBQVksSUFBSSxFQUFFLENBQUMsQ0FBQztZQUMvQyxRQUFRLEdBQUcsTUFBTSxLQUFLLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBRTdDLElBQUksUUFBUSxDQUFDLE1BQU0sSUFBSSxHQUFHLEVBQUU7Z0JBQ3hCLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLENBQUM7YUFDakU7WUFFRCxJQUFJLFFBQVEsQ0FBQyxNQUFNLElBQUksR0FBRyxFQUFFO2dCQUN4QixNQUFNLElBQUkseUJBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUNqQztZQUVELE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3BDLE9BQU8sUUFBUSxDQUFDO1NBQ25CO1FBQUMsT0FBTyxDQUFDLEVBQUU7WUFDUixPQUFPLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1QixNQUFNLENBQUMsQ0FBQztTQUNYO0lBQ0wsQ0FBQztJQUVPLE1BQU0sQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsS0FBNkIsRUFBRSxhQUEwQjtRQUM1RixPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQzNCLE1BQU0sNEJBQVcsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1FBQzFDLElBQUksQ0FBQyxXQUFXLENBQUMsNEJBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN2QyxPQUFPLE1BQU0sS0FBSyxDQUFDLEtBQUssRUFBRSxhQUFhLENBQUMsQ0FBQztJQUM3QyxDQUFDO0NBQ0o7QUFyREQsa0NBcURDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtBdXRoU2VydmljZX0gZnJvbSBcIi4vQXV0aFNlcnZpY2UudHNcIjtcclxuaW1wb3J0IHtIdHRwRXJyb3J9IGZyb20gXCIuLi9leGNlcHRpb25zL0V4Y2VwdGlvbnMudHNcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBIdHRwU2VydmljZSB7XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBqd3RUb2tlbjogc3RyaW5nIHwgdW5kZWZpbmVkO1xyXG4gICAgcHVibGljIHN0YXRpYyBhdXRoU2VydmljZTogQXV0aFNlcnZpY2U7XHJcblxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgcmVzZXRUb2tlbigpIHtcclxuICAgICAgICB0aGlzLmp3dFRva2VuID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKFwiand0VG9rZW5cIik7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBzZXRKd3RUb2tlbihqd3RUb2tlbjogc3RyaW5nIHwgdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgdGhpcy5qd3RUb2tlbiA9IGp3dFRva2VuO1xyXG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwiand0VG9rZW5cIiwgdGhpcy5qd3RUb2tlbiB8fCBcIlwiKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGFzeW5jIGZldGNoKGlucHV0OiBSZXF1ZXN0SW5mbyB8IFVSTCwgaW5pdD86IFJlcXVlc3RJbml0KTogUHJvbWlzZTxSZXNwb25zZT4ge1xyXG4gICAgICAgIGxldCByZXNwb25zZTogUmVzcG9uc2U7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3Qgand0VG9rZW4gPSB0aGlzLmp3dFRva2VuIHx8IGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwiand0VG9rZW5cIik7XHJcbiAgICAgICAgICAgIGNvbnN0IGluaXRXaXRoVG9rZW4gPSB7XHJcbiAgICAgICAgICAgICAgICAuLi5pbml0LFxyXG4gICAgICAgICAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAgICAgICAgIC4uLmluaXQ/LmhlYWRlcnMsXHJcbiAgICAgICAgICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogand0VG9rZW5cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBhcyBSZXF1ZXN0SW5pdDtcclxuXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBpbnB1dDogJHtpbnB1dH0gXFxuaW5pdDogJHtpbml0fWApO1xyXG4gICAgICAgICAgICByZXNwb25zZSA9IGF3YWl0IGZldGNoKGlucHV0LCBpbml0V2l0aFRva2VuKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT0gNDAxKSB7XHJcbiAgICAgICAgICAgICAgICByZXNwb25zZSA9IGF3YWl0IHRoaXMucmV0cnlXaXRoTmV3VG9rZW4oaW5wdXQsIGluaXRXaXRoVG9rZW4pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzID09IDQwMCkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEh0dHBFcnJvcihyZXNwb25zZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwicmVzcG9uc2U6IFwiLCByZXNwb25zZSk7XHJcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvcjogXCIsIGUpO1xyXG4gICAgICAgICAgICB0aHJvdyBlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHN0YXRpYyBhc3luYyByZXRyeVdpdGhOZXdUb2tlbihpbnB1dDogUmVxdWVzdCB8IHN0cmluZyB8IFVSTCwgaW5pdFdpdGhUb2tlbjogUmVxdWVzdEluaXQpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIlJldHJ5IGZldGNoXCIpO1xyXG4gICAgICAgIGF3YWl0IEF1dGhTZXJ2aWNlLnJlZnJlc2hDdXJyZW50U2Vzc2lvbigpO1xyXG4gICAgICAgIHRoaXMuc2V0Snd0VG9rZW4oQXV0aFNlcnZpY2Uuand0VG9rZW4pO1xyXG4gICAgICAgIHJldHVybiBhd2FpdCBmZXRjaChpbnB1dCwgaW5pdFdpdGhUb2tlbik7XHJcbiAgICB9XHJcbn0iXX0=