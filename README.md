# SHOP BASED ON AWS (CDK)

The application presents SHOP based on AWS. Consist of two parts:
- [Frontend(UI)](https://github.com/MartinMartinni/aws-shop/blob/main/ui/README.md) in React + TypeScript + Vite
- [Backend](https://github.com/MartinMartinni/aws-shop/blob/main/backend/README.md) in AWS + CDK + TypeScript

> :warning:  **The application will still be improved**
#### In the near future I am expecting to add:
- CI\CD
- Tests

## Services which I am using:
- Cognito
- API gateway
- Step Functions
- Lambda
- Event Bridge
- DynamoDB
- RDS
- Amplify

## The most interesting part is place order:
![alt text](https://github.com/MartinMartinni/aws-shop/blob/main/place_order_workflow.drawio.png)

1. The user establishes connection by the websocket
2. ConnectionId(websocket connection identifier) and executionName(placer order execution identifier) are saved in database "Connection Table"
3. The user sends request place order by REST API with orderId(order already created) and executionName.
4. AWS Step function workflow is started:
- (order case) get order
- (warehouse case) check, reserve products in warehouse
- (payment case) check user has enough money to fulfilment order and charge him
- (shipment/warehouse revert case) payment success - prepare shipment/payment error - revert products to the warehouse
- (finalization case) update order status in order, handling errors when any occur
5. Send result message about success or error to the event bridge
6. Finding connectionId in database "Connection Table" by the executionName and send result message to the user by the websocket

## Functionalities:
- create user account
- create and managing products
- place order
- get fulfilment orders
- managing user bank account - deposit, withdraw money

## Run App:
1.Go to the backend directory
```
cd backend
```

2.Install dependencies
```
npm install
```

3.Deploy all stacks along with generating cdk-outputs.json file in the UI location, with information about provisioned infrastructure,
which are imported for integration with backend app (without asking about grant access).
```
npm run deploy-all
```

4.Go to the UI directory
```
cd ./../ui/
```

5.Install dependencies
```
npm install
```

6.Build the UI
```
npm run build
```

7.Go to the backend directory
```
cd ./../backend
```

8.Deploy the UI
```
npm run deploy-ui
```

9.The url to the site you can get:
- from terminal under the key FinderUrl
- in the file backend/cdk-outputs.json under the key FinderUrl

Past it in the browser

## Create user account:
1.Go to the login page and click "Create account". You can create user for two roles:
- User (place order)
- Admin (can do that what can do user + managing products)

> :warning:  **Don't forget about verification by email!!**

## Stop App:
Remember to choose "y" to continue process of removing resources
```
npm run destroy-all
```

## Useful links:
- [websocket chat application](https://github.com/aws-samples/websocket-chat-application/tree/main)
- [reactive progress tracking](https://aws.amazon.com/blogs/compute/implementing-reactive-progress-tracking-for-aws-step-functions/)
- [poll to push websockets](https://aws.amazon.com/blogs/compute/from-poll-to-push-transform-apis-using-amazon-api-gateway-rest-apis-and-websockets/)
- [step functions error handling](https://dashbird.io/blog/aws-step-functions-error-handling/)
- [initialize Amazon RDS](https://aws.amazon.com/blogs/infrastructure-and-automation/use-aws-cdk-to-initialize-amazon-rds-instances/)
