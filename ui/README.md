# SHOP based on AWS (Frontend)

## Introduction:
Frontend application for SHOP based on AWS

## Technologies:
- Typescript
- React
- Vite
- Amplify (AWS)

## How to run APP:
> :warning:  **To deploy the UI, you need to first deploy the backend. Otherwise, the UI will not be able to connect with the backend. It is recommended to deploy using [this documentation](https://github.com/MartinMartinni/aws-shop)**

1.Go to the UI directory
```
cd ui
```

2.install dependencies
```
npm install
```

3.Build the UI
```
npm run build
```

4.Go to the backend directory
```
cd ./../backend
```

5.Deploy the UI
```
npm run deploy-ui
```

6.Find URL by:
- from terminal under the key FinderUrl
- in the file backend/cdk-outputs.json under the key FinderUrl

Paste it in the browser

## Create user account:
1.Go to the login page and click "Create account". You can create user for two roles:
- User (placing order)
- Admin (can do that what can do user + managing products)

> :warning:  **Don't forget to verify your email!!**

## How to stop App:
```
npm run destroy-all
```
