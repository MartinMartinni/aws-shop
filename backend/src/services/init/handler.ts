import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import {ProductDynamoDBRepository} from "../repository/ProductDynamoDBRepository";
import {
    addCorsHeader,
    getErrorResponse, getResponseFor
} from "../utils/HttpUtils";
import {ProductEntity} from "../entity/no-sql/Entities";
import * as AWS from "aws-sdk";
import * as fs from "fs";
// @ts-ignore
import planBImg from "./assets/planB_classic.jpg";
// @ts-ignore
import elementImg from "./assets/element_classic.jpg";
// @ts-ignore
import girlImg from "./assets/girl_classic.jpg";
// @ts-ignore
import bakerImg from "./assets/baker_classic.jpg";
// @ts-ignore
import creatureImg from "./assets/creature_classic.jpg";
// @ts-ignore
import chocolateImg from "./assets/chocolate_classic.jpg";
// @ts-ignore
import deathWishImg from "./assets/deathwish_classic.jpg";
// @ts-ignore
import shortysImg from "./assets/shortys_classic.jpg";
// @ts-ignore
import realImg from "./assets/real_classic.jpg";
// @ts-ignore
import zeroImg from "./assets/zero_skull.jpg";

const repository = new ProductDynamoDBRepository();
const photoBucket = process.env.BUCKET_PHOTO_NAME!;

async function handler(event: APIGatewayProxyEvent, context: Context) : Promise<APIGatewayProxyResult> {

    console.log("Incoming request: " + event.path + " \n" +
        "- queryParameters: " + JSON.stringify(event.queryStringParameters) + "\n" +
        "- body: " + JSON.stringify(event.body));

    let response: APIGatewayProxyResult;

    const s3 = new AWS.S3();

    try {
        const products: ProductEntity[] = [
            {
                id: "",
                name: "PlanB classic",
                img: planBImg,
                price: 70,
                quantity: Math.floor(Math.random() * 100),
                createdAt: ""
            },
            {
                id: "",
                name: "Element classic",
                img: elementImg,
                price: 50,
                quantity: Math.floor(Math.random() * 100),
                createdAt: ""
            },
            {
                id: "",
                name: "Girl classic",
                img: girlImg,
                price: 78,
                quantity: Math.floor(Math.random() * 100),
                createdAt: ""
            },
            {
                id: "",
                name: "Baker classic",
                img: bakerImg,
                price: 73,
                quantity: Math.floor(Math.random() * 100),
                createdAt: ""
            },
            {
                id: "",
                name: "Creature classic",
                img: creatureImg,
                price: 45,
                quantity: Math.floor(Math.random() * 100),
                createdAt: ""
            },
            {
                id: "",
                name: "Chocolate classic",
                img: chocolateImg,
                price: 60,
                quantity: Math.floor(Math.random() * 100),
                createdAt: ""
            },
            {
                id: "",
                name: "Deathwish classic",
                img: deathWishImg,
                price: 65,
                quantity: Math.floor(Math.random() * 100),
                createdAt: ""
            },
            {
                id: "",
                name: "Shorty's classic",
                img: shortysImg,
                price: 62,
                quantity: Math.floor(Math.random() * 100),
                createdAt: ""
            },
            {
                id: "",
                name: "Real classic",
                img: realImg,
                price: 70,
                quantity: Math.floor(Math.random() * 100),
                createdAt: ""
            },
            {
                id: "",
                name: "Zero skull",
                img: zeroImg,
                price: 70,
                quantity: Math.floor(Math.random() * 100),
                createdAt: ""
            },
        ];

        for (const product of products) {
            const imageBuffer = Buffer.from(fs.readFileSync(product.img));

            const params = {
                Bucket: photoBucket,
                Key: product.img.replace("./", ""),
                Body: imageBuffer
            };

            const uploadedImg = await s3.upload(params).promise();

            product.img = uploadedImg.Location;
        }

        console.log("products to save: ", products);

        const savedProducts = await repository.saveAll(products);

        response = getResponseFor(201, savedProducts);
    } catch (e) {
        console.error("Error: ", e);

        response = getErrorResponse((e as Error));
    }

    addCorsHeader(response);
    return response;
}

export {handler};