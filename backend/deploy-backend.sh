#!/bin/bash

EXCLUDED_STACK="UiDeploymentStack"

BACKEND_STACKS_TO_DEPLOY=$(cdk list | grep -v "$EXCLUDED_STACK")

echo "Stacks which will not be deployed: $EXCLUDED_STACK"
echo "Stacks to deploy: $BACKEND_STACKS_TO_DEPLOY"

cdk deploy $BACKEND_STACKS_TO_DEPLOY --require-approval never --outputs-file ./../ui/cdk-outputs.json
