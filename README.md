# SHOP BASED ON AWS (CDK)

The project is a web application which is a shop based on AWS. The two parts are:
- [Frontend(UI)](https://github.com/MartinMartinni/aws-shop/blob/main/ui/README.md) in React + TypeScript + Vite
- [Backend](https://github.com/MartinMartinni/aws-shop/blob/main/backend/README.md) in AWS + CDK + TypeScript

> :warning:  **The application will still be improved**

## Services which I am using:
- Cognito
- API gateway
- Step Functions
- Lambda
- Event Bridge
- DynamoDB
- RDS
- Amplify
- CodePipeline (CICD)

## The most interesting part is place order:
![alt text](https://github.com/MartinMartinni/aws-shop/blob/main/place_order_workflow.drawio.png)

1. The user establishes connection by websocket
2. ConnectionId(websocket connection identifier) and executionName(placer order execution identifier) are saved in database "Connection Table"
3. The user sends request place order by REST API with orderId(order already created) and executionName.
4. AWS Step function workflow is started:
- (order case) get order
- (warehouse case) check, reserve products in warehouse
- (payment case) check user has enough money to fulfil order and charge them
- (shipment/warehouse revert case) if payment success - prepare shipment. Else if payment error - revert products to the warehouse
- (finalization case) update order status in order, handle errors when any occur
5. Send result message about success or error to the event bridge
6. Finding connectionId in database "Connection Table" by the executionName and send result message to the user by the websocket

## Functionalities:
- create user account
- create and manage products
- place order
- get fulfilment orders
- managing user bank account - deposit, withdraw money

## How to run APP:

1.Run app:

You can run app in two configurations for orders:

- no-sql DYNAMO db
```
./launch-app.sh
```
- sql - relation database (RDS) db
```
./launch-app.sh RDS
```

Script will:
- run db (DYNAMO/RDS)
- deploy backend
- deploy cicd pipelines
- install dependencies, build ui
- deploy ui

2.Find URL by:
- from terminal under the key FinderUrl
- in the file backend/cdk-outputs.json under the key FinderUrl

Paste it in the browser

## Login on exising user
Choose user from login screen (table) and login

## Create user account:
Go to the login page and click "Create account"
- User (placing order)

Blocked:
- Admin (can do that what can do user + managing products).

> :warning:  **Don't forget to verify your email!!**

## Run integration tests
1.Go to the ui
```
cd ui
```
2.Run tests
```
npm test
```

Tests based on websockets, because the main ordering mechanism is based on them

## Run pipelines with integration tests (CICD)
1. Deploy the whole infrastructure. Check "How to run APP" 
2. Edit the code, commit, push, merge
3. Pipelines will be triggered automatically after merge to the develop branch
4. Pipelines will be triggered automatically after merge to the main branch with manual deployment

GitFlow (feature -> develop -> main).
You can see the results in the AWS "CodePipeline" service.

### What pipelines do:
- download source code from Github repo from develop branch
- build the code
- run integration tests
- deploy after manual approval

## How to stop App:
```
./delete-app.sh
```

## Useful links:
- [websocket chat application](https://github.com/aws-samples/websocket-chat-application/tree/main)
- [reactive progress tracking](https://aws.amazon.com/blogs/compute/implementing-reactive-progress-tracking-for-aws-step-functions/)
- [poll to push websockets](https://aws.amazon.com/blogs/compute/from-poll-to-push-transform-apis-using-amazon-api-gateway-rest-apis-and-websockets/)
- [step functions error handling](https://dashbird.io/blog/aws-step-functions-error-handling/)
- [initialize Amazon RDS](https://aws.amazon.com/blogs/infrastructure-and-automation/use-aws-cdk-to-initialize-amazon-rds-instances/)