// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { v4 as uuidv4 } from "uuid";

export function generateRandomId() {
    return uuidv4();
}