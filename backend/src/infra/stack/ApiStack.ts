import { AuthorizationType, CognitoUserPoolsAuthorizer, Cors, LambdaIntegration, MethodOptions, ResourceOptions, RestApi } from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import {Stack, StackProps} from "aws-cdk-lib";
import {IUserPool} from "aws-cdk-lib/aws-cognito";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import {StateMachine} from "aws-cdk-lib/aws-stepfunctions";

interface ApiStackProps extends StackProps{
  productLambdaIntegration: LambdaIntegration
  userLambdaIntegration: LambdaIntegration
  orderLambdaIntegration: LambdaIntegration
  userCreditBankAccountLambdaIntegration: LambdaIntegration
  userPool: IUserPool
  stateMachine: StateMachine
}

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const servicePrefix: string = "ApigwStepFunctionsCdk";

    const optionsWithCors: ResourceOptions = {
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS
      }
    }

    const api = new RestApi(this, "RestApi", optionsWithCors);
    const stateMachineArn = props.stateMachine.stateMachineArn
    const authorizer = new CognitoUserPoolsAuthorizer(this, "SpacesApiAuthorizer", {
      cognitoUserPools:[props.userPool],
      identitySource: "method.request.header.Authorization"
    });
    authorizer._attachToApi(api);

    const optionsWithAuth: MethodOptions = {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.authorizerId
      }
    }

    const users = api.root.addResource("users");
    users.addMethod("GET", props.userLambdaIntegration, optionsWithAuth);
    users.addMethod("PATCH", props.userLambdaIntegration, optionsWithAuth);

    const products = api.root.addResource("products");
    products.addMethod("GET", props.productLambdaIntegration, optionsWithAuth);
    products.addMethod("POST", props.productLambdaIntegration, optionsWithAuth);
    products.addMethod("PUT", props.productLambdaIntegration, optionsWithAuth);
    products.addMethod("DELETE", props.productLambdaIntegration, optionsWithAuth);

    const orders = api.root.addResource("orders");
    orders.addMethod("GET", props.orderLambdaIntegration, optionsWithAuth);
    orders.addMethod("POST", props.orderLambdaIntegration, optionsWithAuth);

    const activeResource = orders.addResource("{userId}").addResource("active");
    activeResource.addMethod("GET", props.orderLambdaIntegration, optionsWithAuth);

    const userCreditBankAccount = api.root.addResource("user-credit-bank-account");
    userCreditBankAccount.addMethod("GET", props.userCreditBankAccountLambdaIntegration, optionsWithAuth);

    /**
     * Create the policy statement that allows synchoronous execution of the Step Function
     */
    const policyStatement = new iam.PolicyStatement({
      /**
       * A full list of StepFunction actions can be found here :
       */
      actions: ["states:StartExecution"],
      effect: iam.Effect.ALLOW,
      resources: [stateMachineArn],
    });

    /**
     * Create a policy to house the policy statements above.
     */
    const policy = new iam.Policy(this, "Start Execution Policy", {
          statements: [policyStatement],
          policyName: `${servicePrefix}-StartExecutionRole`,
        });

    /**
     * Create an execution role to be assumed by API Gateway.
     */
    const role = new iam.Role(this, "Execution Role", {
      assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
      roleName: `${servicePrefix}-ExecutionRole`,
    });

    /**
     * Attach the StartSyncExecution Policy to the API Gateway Exeuction role.
     */
    role.attachInlinePolicy(policy);

    /**
     * Prepare a response template in VTL to handle Success / Error states, and light transformation
     */
    const responseTemplate: string = `
            #set ($response = $util.parseJson($input.body))
            #set ($requestId = $response.name)
            
            #if ($response.status == "SUCCEEDED")
              {
                "_RequestId" : "$requestId",
                "data" : $response.output
              }
            #elseif ($response.status == "FAILED")
              #set ($cause = $util.parseJson($response.cause))
              #set($context.responseOverride.status = 500)
              {
                  "_RequestId" : "$requestId",
                  "error": "$cause.errorMessage"
              }
            #else
              #set($context.responseOverride.status = 500)
              $input.body
            #end`;

    /**
     * Add the Step Function inegration to the root path POST method, ensuring that the API Gateway
     * has an authorized execution role, and providing transfomations for integration input and output.
     */
    api.root.addMethod(
        "POST",
        new apigw.AwsIntegration({
          service: "states",
          action: "StartExecution",
          integrationHttpMethod: "POST",
          options: {
            credentialsRole: role,
            integrationResponses: [
              {
                statusCode: "200",
                responseParameters: {
                  'method.response.header.Access-Control-Allow-Origin': "'*'",
                },
                responseTemplates: {
                  "application/json": responseTemplate,
                },
              },
            ],
            requestTemplates: {
              // https://docs.aws.amazon.com/step-functions/latest/apireference/API_StartExecution.html#API_StartExecution_RequestSyntax
              "application/json": `
                            {
                                "input": "$util.escapeJavaScript($input.body)",
                                "stateMachineArn": "${stateMachineArn}"
                            }`,
            },
          },
        }),
        {
          methodResponses: [{
            statusCode: "200",
            responseParameters: {
              'method.response.header.Content-Type': true,
              'method.response.header.Access-Control-Allow-Origin': true,
              'method.response.header.Access-Control-Allow-Credentials': true
            }
          }],
        }
    );
  }
}
