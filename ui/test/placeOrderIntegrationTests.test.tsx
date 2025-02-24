import {Order, OrderStatus, Product, RequestErrorField, User} from "../src/model/Models";
import {OrderService} from "../src/services/OrderService";
import {generateRandomId} from "../src/utils/Utils";
import {WebSocketApiStack} from "../cdk-outputs.json";
import {HttpError} from "../src/exceptions/Exceptions";
import {AuthService} from "../src/services/AuthService"
import {UserService} from "../src/services/UserService";
import WebSocket from 'ws';
import {HttpService} from "../src/services/HttpService"
import {ProductService} from "../src/services/ProductService";
import {PhotoStorageService} from "../src/services/PhotoStorageService";

global.localStorage = {
    getItem: (key: string) => (key in localStorage ? localStorage[key] : null),
    setItem: (key: string, value: string) => {
      localStorage[key] = value || '';
    },
    removeItem: (key: string) => {
      delete localStorage[key];
    },
    clear: () => {
      Object.keys(localStorage).forEach(key => delete localStorage[key]);
    },
} as Storage;

const delayService = (): { promise: (ws: WebSocket, fn: ((event: WebSocket.MessageEvent) => void)) => Promise<void> } => {

    const promise = (ws: WebSocket, fn: ((event: WebSocket.MessageEvent) => void)) => new Promise<void>((resolve) => {
        ws.onmessage = (event) => {
            fn(event);
            resolve();
        };
    });
        
    return {
        promise
    }
}

const initData = async (productService: ProductService): Promise<Product[]> => {
    const productsToSave = [{
        id: "1",
        name: "COMPLETED",
        img: "A",
        price: 70,
        quantity: 2,
        createdAt: ""
    },
    {
        id: "2",
        name: "WrongOrderPriceError",
        img: "B",
        price: 80,
        quantity: 1,
        createdAt: ""
    },
    {
        id: "3",
        name: "ProductsUnavailableError",
        img: "C",
        price: 80,
        quantity: 0,
        createdAt: ""
    },{
        id: "4",
        name: "UserDoesNotHaveEnoughOfMoney",
        img: "D",
        price: 80,
        quantity: 1,
        createdAt: ""
    }] as Product[];

    await productService.saveAll(productsToSave);

    const productIds = productsToSave.map((pr: Product) => pr.id);
    return productService.findAll(productIds);
}

const initUser = async (authService: AuthService, userService: UserService): Promise<User> => {
    const email = "jan.kowalski@test.com";
    const password = "JanKowalski!@1";

    let cognitoUser = await authService.login(email, password);

    if (cognitoUser == undefined) {
        await authService.signUp(
            "JanKowalski",
            password,
            email,
            {
                "custom:role": "ADMIN",
                "custom:amountOfMoney": "0",
                "custom:domain": "test.com"
            }
        );
        cognitoUser = await authService.login(email, password);
    }

    HttpService.setJwtToken(AuthService.jwtToken);
    
    const user = await userService.getUser(AuthService.jwtToken!) as User;
    expect(user).not.toBeNull();

    await userService.updateAmountOfMoney(user?.id!, 1000);

    return user;
}

const initWebsocketConnection = (): WebSocket | null => {
    const webSocketUrl = `${WebSocketApiStack.WebSocketApiEndpoint}/dev/`;
    const socket = new WebSocket(webSocketUrl);

    console.log("establish websocket connection with url: ", webSocketUrl);
    socket.onopen = (event) => {
        console.log("WebSocket opened: ", event);
    };

    socket.onerror = (event) => {
        console.log("Error: ", event);
    }

    socket.onclose = (event) => {
        console.log("WebSocket closed: ", event);
    };

    return socket;
} 

describe("WebSocket API Integration Test", () => {

    let orderService: OrderService;
    let socket: WebSocket;
    let user: User | undefined;
    let products: Product[];

    const authService = new AuthService();
    const photoStorageService = new PhotoStorageService(authService);
    const productService = new ProductService(photoStorageService);
    const userService = new UserService(authService);
    const delay = delayService();

    beforeAll(async () => {
        user = await initUser(authService, userService);

        orderService = new OrderService();

        socket = initWebsocketConnection()!;

        products = await initData(productService);
        console.log("products: ", products);
    }, 30000);

    beforeEach(() => {
        const testName = expect.getState().currentTestName; // Get the current test name
        console.log(`Starting test: ${testName}`);
    });

    afterAll(async () => {
        if (socket) {
          socket.close();
        }

        const user = await userService.getUser(AuthService.jwtToken!) as User;
        await productService.deleteByIds(products.map((pr: Product) => pr.id));
        await userService.updateAmountOfMoney(user?.id!, -user?.amountOfMoney!);
    }, 15000);

    test("should place order and responde with the status COMPLETED", async () => {
        // given
        const product = products.find(pr => pr.id == "1")!;

        const quantity = 2;
        const priceInTotal = product.price * quantity;
        const order = {
            userId: user?.id,
            price: priceInTotal,
            orderStatus: OrderStatus.PENDING,
            address: {
                country: "Poland",
                city: "Warsaw",
                street: "Al",
                postCode: "01-111",
                houseNumber: "11",
                localNumber: "22"
            },
            items: [
                {
                    price: product.price,
                    productId: product.id,
                    productName: product.name,
                    productImg: product.img,
                    quantity: quantity,
                    subTotal: priceInTotal
                }
            ]
        } as Order;
        
        let savedOrder!: Order;

        try {
            // when
            savedOrder = await orderService.save(order);
        } catch (e) {
            console.log("exception COMPLETED: ", e);
            const error = e as HttpError;
            const response = error.response;
            const json = await response.json();
            console.log(json);
        }

        const executionName = generateRandomId();

        socket.send(JSON.stringify({"action": "trackStatus", "executionName": executionName}));

        try {
            const result = await orderService.place(`${savedOrder.id}`, savedOrder.userId, executionName) as { executionName: string } | undefined;
            console.log(result?.executionName);
            await delay.promise(socket, (event) => {
                // then
                console.log("Received data:", event.data);
                const data = JSON.parse(event.data.toString());           
                expect(data.status).toEqual(OrderStatus.COMPLETED);
                expect(data.executionName).toEqual(executionName);
            });
        } catch (e) {
            console.error(e);
        }
    }, 15000);

    test("should return error message and responde with the status FAILURE when wrong order price", async () => {
        // given
        const product = products.find(pr => pr.id == "2")!;
        const quantity = 1;
        const price = 20;
        const order = {
            userId: user?.id,
            price: price,
            orderStatus: OrderStatus.PENDING,
            address: {
                country: "Poland",
                city: "Warsaw",
                street: "Al",
                postCode: "01-111",
                houseNumber: "11",
                localNumber: "22"
            },
            items: [
                {
                    price: product.price,
                    productId: product.id,
                    productName: product.name,
                    productImg: product.img,
                    quantity: quantity,
                    subTotal: price
                }
            ]
        } as Order;
        
        let savedOrder!: Order;

        try {
            // when
            savedOrder = await orderService.save(order);
        } catch (e) {
            console.log("exception wrong order price: ", e);
            const error = e as HttpError;
            const response = error.response;
            const json = await response.json();
            console.log(json);
        }

        const executionName = generateRandomId();

        socket.send(JSON.stringify({"action": "trackStatus", "executionName": executionName}));

        try {
            const result = await orderService.place(`${savedOrder.id}`, savedOrder.userId, executionName) as { executionName: string } | undefined;
            console.log(result?.executionName);
            await delay.promise(socket, (event) => {
                // then
                console.log("Received data:", event.data);
                const data = JSON.parse(event.data.toString());               
                expect(data.status).toEqual(OrderStatus.FAILURE);
                expect(data.executionName).toEqual(executionName);
    
                const backendPriceInTotal = product.price * quantity;
                const exception = JSON.parse(data.errorMessage)?.exception;
                expect(+exception.frontend).toEqual(price);
                expect(+exception.backend).toEqual(backendPriceInTotal);
                expect(exception.name).toEqual("WrongOrderPriceError");

                // expect(exception.message).toEqual(`Order prices provided: \"${price}\" and calculated: \"${backendPriceInTotal}\" are not the same!`);
                expect(exception.message).toMatch(new RegExp(`^Order prices provided: \"${price}\"`));
                expect(exception.message).toMatch(new RegExp(`and calculated: \"${backendPriceInTotal}\" are not the same\!$`));
            })
        } catch (e) {
            console.error(e);
        }
    }, 15000);

    test("should return error message and responde with the status FAILURE when product unavailable", async () => {
        // given
        const quantity = 2;
        const product = products.find(pr => pr.id == "3")!;

        const price = 20;
        const order = {
            userId: user?.id,
            price: price,
            orderStatus: OrderStatus.PENDING,
            address: {
                country: "Poland",
                city: "Warsaw",
                street: "Al",
                postCode: "01-111",
                houseNumber: "11",
                localNumber: "22"
            },
            items: [
                {
                    price: product.price,
                    productId: product.id,
                    productName: product.name,
                    productImg: product.img,
                    quantity: quantity,
                    subTotal: price
                }
            ]
        } as Order;
        
        let savedOrder!: Order;

        try {
            // when
            savedOrder = await orderService.save(order);
        } catch (e) {
            console.log("exception product unavailable: ", e);
            const error = e as HttpError;
            const response = error.response;
            const json = await response.json();
            console.log(json);
        }

        const executionName = generateRandomId();

        socket.send(JSON.stringify({"action": "trackStatus", "executionName": executionName}));

        try {
            const result = await orderService.place(`${savedOrder.id}`, savedOrder.userId, executionName) as { executionName: string } | undefined;
            console.log(result?.executionName);
            await delay.promise(socket, (event) => {
                // then
                console.log("Received data:", event.data);
                const data = JSON.parse(event.data.toString());               
                expect(data.status).toEqual(OrderStatus.FAILURE);
                expect(data.executionName).toEqual(executionName);

                const exception = JSON.parse(data.errorMessage)?.exception;
                expect(exception.name).toEqual("ProductsUnavailableError");
                expect(exception.message).toEqual(`Products by "id": "${product.id}", by "name": "${product.name}" not available!`);
            });
        } catch (e) {
            console.error(e);
        }
    }, 15000);
    
    test("should return error message and responde with the status FAILURE when user doesn't have enough of money", async () => {
        // given
        const quantity = 1;
        const product = products.find(pr => pr.id == "4")!;

        const user = await userService.getUser(AuthService.jwtToken!) as User;
        const amountOfMoneyToUpdate = -(user.amountOfMoney - 1);//return 1

        await userService.updateAmountOfMoney(user?.id!, amountOfMoneyToUpdate);

        const order = {
            userId: user?.id,
            price: product.price * quantity,
            orderStatus: OrderStatus.PENDING,
            address: {
                country: "Poland",
                city: "Warsaw",
                street: "Al",
                postCode: "01-111",
                houseNumber: "11",
                localNumber: "22"
            },
            items: [
                {
                    price: product.price,
                    productId: product.id,
                    productName: product.name,
                    productImg: product.img,
                    quantity: quantity,
                    subTotal: product.price * quantity
                }
            ]
        } as Order;
        
        let savedOrder!: Order;

        try {
            // when
            savedOrder = await orderService.save(order);
        } catch (e) {
            console.log("exception user doesn't have enough of money: ", e);
            const error = e as HttpError;
            const response = error.response;
            const json = await response.json();
            console.log(json);
        }

        const executionName = generateRandomId();

        socket.send(JSON.stringify({"action": "trackStatus", "executionName": executionName}));

        try {
            const result = await orderService.place(`${savedOrder.id}`, savedOrder.userId, executionName) as { executionName: string } | undefined;
            console.log(result?.executionName);
            await delay.promise(socket, (event) => {
                // then
                console.log("Received data:", event.data);
                const data = JSON.parse(event.data.toString());               
                expect(data.status).toEqual(OrderStatus.FAILURE);
                expect(data.executionName).toEqual(executionName);

                const exception = JSON.parse(data.errorMessage)?.exception;
                expect(exception.name).toEqual("UserDoesNotHaveEnoughOfMoney");
                expect(exception.message).toEqual("User doesn't have enough of money to fulfilment order");
            });
        } catch (e) {
            console.error(e);
        }
    }, 15000);

    test("should return error message when Order doesn't have required fields", async () => {
        // given
        const order = {
            userId: user?.id,
            price: 20,
            orderStatus: OrderStatus.PENDING,
            address: {
                country: "Poland",
                city: "Warsaw",
                street: "Al",
                postCode: "01-111",
                houseNumber: "11",
                localNumber: "22"
            },
            items: [
                {
                    // id: 2,
                    // price: 10,
                    // productId: "productId",
                    // productName: "productName",
                    // quantity: 2,
                    // subTotal: 20
                }
            ]
        } as Order;
        
        try {
            // when
            await orderService.save(order);
        } catch (e) {
            console.log("exception required fields: ", e);
            const error = e as HttpError;
            const response = error.response;
            const json = await response.json();

            // then
            expect(response.status).toEqual(400);

            const requestBodyFields = json.requestBodyFields as RequestErrorField[];

            expect(requestBodyFields).toEqual([
                {"name":"productId","path":"items[0].productId","message":"Required field"},
                {"name":"quantity","path":"items[0].quantity","message":"Required field"},
                {"name":"price","path":"items[0].price","message":"Required field"},
                {"name":"subTotal","path":"items[0].subTotal","message":"Required field"}
            ]);
        }
    });
});