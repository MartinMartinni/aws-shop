#!/bin/sh

echo "export ORDERS_DB_TYPE=DYNAMO"
export ORDERS_DB_TYPE=DYNAMO

cd ./backend
pwd

echo "npm run deploy-all"
npm run deploy-all

cd ../ui
pwd

echo "npm run build"
npm run build

cd ../backend
pwd

echo "export DEPLOY_UI=true"
export DEPLOY_UI=true

echo "npm run deploy-all"
npm run deploy-all