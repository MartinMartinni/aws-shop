import {HttpService} from "./HttpService.ts";
import {RestApiStack} from "../../cdk-outputs.json";

export abstract class AbstractService<T> {

    protected url: string;
    protected websocketUrl: string = RestApiStack.RestApiEndpoint0551178A

    protected constructor(url: string) {
        this.url = url;
    }

    public async findAll() : Promise<T[]> {
        try {
            const result = await HttpService.fetch(this.url, {
                method: "GET",
            });
            return await result.json() as T[];
        } catch (e) {
            console.error("Error: ", e);
            return [];
        }
    }

    public async save(value: T) : Promise<T> {
        try {
            const result = await HttpService.fetch(this.url, {
                method: "POST",
                body: JSON.stringify(value)
            })
            return await result.json() as T;
        } catch (e) {
            console.error("Error: ", e);
            throw e;
        }
    }
    public async update(id:string, value: T) : Promise<T | undefined> {
        try {
            const result = await HttpService.fetch(`${this.url}?id=${id}`, {
                method: "PUT",
                body: JSON.stringify(value)
            })
            return await result.json() as T;
        } catch (e) {
            console.error("Error: ", e);
            return undefined;
        }
    }
    public async deleteById(id: string) : Promise<void> {
        try {
            await HttpService.fetch(`${this.url}?id=${id}`, {
                method: "DELETE"
            })
        } catch (e) {
            console.error("Error: ", e);
        }
    }
}