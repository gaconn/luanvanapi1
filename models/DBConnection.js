const mysql2= require('mysql2')
require('dotenv').config()
function poolConnection() {
    let conn=  mysql2.createPool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: process.env.DB_WAIT_FOR_CONNECTION,
        connectionLimit: process.env.DB_CONNECTION_LIMIT,
        queueLimit: process.env.DB_QUEUE_LIMIT
    })
    const promiseConn= conn.promise()
    return promiseConn
}

module.exports = poolConnection()