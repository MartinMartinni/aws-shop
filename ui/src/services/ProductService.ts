import {RestApiStack} from "../../cdk-outputs.json";
import {AbstractService} from "./AbstractService.ts";
import {Product} from "../model/Models.ts";
import {HttpService} from "./HttpService.ts";
import {PhotoStorageService} from "./PhotoStorageService.ts";

export class ProductService extends AbstractService<Product> {

    private photoStorageService: PhotoStorageService;

    constructor(photoStorageService: PhotoStorageService) {
        super(RestApiStack.RestApiEndpoint0551178A + "products");
        this.photoStorageService = photoStorageService;
    }

    public async saveWithImg(value: Product, photo?: File) : Promise<Product> {
        try {
            if (photo) {
                value.img = await this.photoStorageService.uploadPublicFile(photo);
            }
            const result = await HttpService.fetch(this.url, {
                method: "POST",
                body: JSON.stringify(value)
            })
            return await result.json() as Product;
        } catch (e) {
            console.error("Error: ", e);
            throw e;
        }
    }

    public async deleteByIds(ids: string[]) : Promise<void> {
        try {
            await HttpService.fetch(`${this.url}?ids=${ids}`, {
                method: "DELETE"
            })
        } catch (e) {
            console.error("Error: ", e);
        }
    }
}