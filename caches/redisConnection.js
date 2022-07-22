const redis = require('redis')
require('dotenv').config()
const redisConnection = async () => {
    const client = redis.createClient({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT_NUMBER
    })
    
    client.on("error", (error) => console.log(error))
    
    await client.connect()
    return client 
}
