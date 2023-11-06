# SHOP based on AWS (Backend)

## Introduction:
Backend application for SHOP based on AWS.

## Technologies:
- Typescript
- CDK
- AWS

### AWS components:
- Cognito
- API gateway
- Step Functions
- Lambda
- Event Bridge
- DynamoDB
- RDS
- Amplify

## Place order process:
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

## Stop App:
```
npm run destroy-all
```
