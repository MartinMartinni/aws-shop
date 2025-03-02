#!/bin/sh

ORDERS_DB_TYPE="${1:-DYNAMO}"

if [ $ORDERS_DB_TYPE != "RDS" ]
then
    export ORDERS_DB_TYPE=DYNAMO
fi

echo "exported value ORDERS_DB_TYPE: " $ORDERS_DB_TYPE

cd ./backend
pwd

echo "npm run deploy-all"
npm run deploy-all

cd ../ui
pwd

echo "npm install"
npm install

echo "npm run build"
npm run build

cd ../backend
pwd

echo "export DEPLOY_UI=true"
export DEPLOY_UI=true

echo "export DOMAIN=aws-shop.click"
export DOMAIN=aws-shop.click

echo "npm run deploy-all"
npm run deploy-all