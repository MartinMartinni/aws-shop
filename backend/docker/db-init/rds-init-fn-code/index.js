const mysql = require("mysql2/promise")
const AWS = require("aws-sdk")
const fs = require("fs")
const path = require("path")

const dbSecretArn = process.env.DB_SECRET_ARN || "";
const secretManager = new AWS.SecretsManager({});
const secretParams = {
    SecretId: dbSecretArn
};

exports.handler = async (e) => {

    let config = {};
    let dbSecret;
    try {
        dbSecret = await secretManager.getSecretValue(secretParams).promise();
        const secretString = dbSecret.SecretString || "";

        if (!secretString) {
            throw new Error("secret string is empty");
        }

        console.log("secretValues: ", secretString);
        const secretValues = JSON.parse(secretString || "{}");
        const { host, dbname, username, password } = secretValues;

        config = {
            dbname,
            host,
            user: username,
            password,
            multipleStatements: true
        };

        const connection = await mysql.createConnection(config);
        await connection.connect();

        const sqlScript = fs.readFileSync(path.join(__dirname, "script.sql")).toString()
        const res = await connection.query(sqlScript);
        await connection.end();

        return {
            status: "OK",
            results: res,
            config: config,
            dbSecret
        }
    } catch (err) {
        return {
            status: "ERROR",
            err,
            config: config,
            dbSecret,
            message: err.message
        }
    }
}