#!/bin/sh

ORDERS_DB_TYPE="${1:-DYNAMO}"

if [ $ORDERS_DB_TYPE != "RDS" ]
then
    export ORDERS_DB_TYPE=DYNAMO
fi
echo "exported value" $ORDERS_DB_TYPE

echo "export DEPLOY_UI=true"
export DEPLOY_UI=true

cd ./backend
pwd

echo "npm run destroy-all"
npm run destroy-all

DOMAIN=aws-shop.click
echo "export DOMAIN: "$DOMAIN
export DOMAIN

echo "npm run destroy-all"
npm run destroy-all