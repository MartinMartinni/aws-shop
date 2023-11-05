import { randomUUID } from "crypto";
import {JSONError} from "../exception/Exceptions";

export function createRandomId(){
    return randomUUID();
}
export function parseJSON(val: any) {
    try {
        console.log("before parseJSON: ", val);
        let parsedVal = JSON.parse(val);
        console.log("after parseJSON: ", val);
        return parsedVal;
    } catch (e) {
        throw new JSONError((e as Error).message);
    }
}