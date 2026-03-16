// lib/redis.js
const redis = require('redis');
const REDIS_URL = process.env.REDIS_URL;

const client = redis.createClient({url: REDIS_URL});

client.on('error', (err) => {
    console.error('Redis connection error:', err);
});

client.connect()
    .then(() => {
        console.log('Connected to Redis');
    })
    .catch((err) => {
        console.error('Redis connection failed:', err);
    });

module.exports = client;