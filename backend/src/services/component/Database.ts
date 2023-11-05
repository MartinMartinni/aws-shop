import {
    Connection,
    ConnectionManager,
    ConnectionOptions,
    createConnection,
    getConnectionManager
} from "typeorm"
import {Orders} from "../entity/sql/Orders";
import {OrderItems} from "../entity/sql/OrderItems";
import {Address} from "../entity/sql/Address";
import * as AWS from "aws-sdk";

const dbSecretArn = process.env.DB_SECRET_ARN || "";
const secretManager = new AWS.SecretsManager({});
const secretParams = {
    SecretId: dbSecretArn
};

export class Database {

    private connectionManager: ConnectionManager;
    constructor() {
        this.connectionManager = getConnectionManager();
    }

    async getConnection(): Promise<Connection> {
        const CONNECTION_NAME = 'default';

        let connection: Connection;

        if (this.connectionManager.has(CONNECTION_NAME)) {
            console.log(`Database.getConnection()-using existing connection::: ${CONNECTION_NAME}`);
            connection = await this.connectionManager.get(CONNECTION_NAME);

            if (!connection.isConnected) {
                connection = await connection.connect();
            }
        } else {
            console.log('Database.getConnection()-creating connection ...');

            const dbSecret = await secretManager.getSecretValue(secretParams).promise();
            const secretString = dbSecret.SecretString || "";

            if (!secretString) {
                throw new Error("secret string is empty");
            }

            console.log("secretValues: ", secretString);
            const secretValues = JSON.parse(secretString || "{}");
            const { host, dbname, username, password } = secretValues;

            console.log(`DB host::: ${host}`);

            const connectionOptions: ConnectionOptions = {
                name: CONNECTION_NAME,
                type: "mysql",
                port: 3306,
                synchronize: true,
                logging: true,
                host: host,
                database: dbname,
                username: username,
                password: password,
                entities: [Orders, OrderItems, Address]
            };

            connection = await createConnection(connectionOptions);
        }

        return connection;
    }
}