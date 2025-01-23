import {Fn, Stack} from "aws-cdk-lib";
import { v4 as uuidv4 } from "uuid";

export function getSuffixFromStack(stack: Stack) {
    const shortStackId = Fn.select(2, Fn.split("/", stack.stackId));
    return Fn.select(4, Fn.split("-", shortStackId));
}

export function generateRandomId() {
    return uuidv4();
}