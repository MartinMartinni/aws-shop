# SHOP based on AWS (Frontend)

## Introduction:
Frontend application for SHOP based on AWS

## Technologies:
- Typescript
- React
- Vite
- Amplify (AWS)

## Run App:
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

6.The url to the site you can get:
- from terminal under the key FinderUrl
- in the file backend/cdk-outputs.json under the key FinderUrl

Past it in the browser

## Create user account:
1.Go to the login page and click "Create account". You can create user for two roles:
- User (place order)
- Admin (can do that what can do user + managing products)

> :warning:  **Don't forget about verification by email!!**

## Stop App:
```
npm run destroy-all
```
