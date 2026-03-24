import os
from pymongo import MongoClient
import redis

# Environment variables
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# MongoDB client
mongo_client = MongoClient(MONGODB_URI)
try:
    # Attempt to use the 'chat_app' database
    db = mongo_client["chat_app"]
    messages_collection = db["messages"]
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")

# Redis client
try:
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    # Enable keyspace notifications for expiration (Ex)
    redis_client.config_set('notify-keyspace-events', 'Ex')
except Exception as e:
    print(f"Error connecting to Redis: {e}")
