from datetime import datetime, timedelta
from database import messages_collection, redis_client
import json
from bson.objectid import ObjectId

class ChatManager:
    def __init__(self):
        pass

    def add_user(self, username: str):
        """Add user to online list in Redis"""
        # Store as a set of active users
        redis_client.sadd('online_users', username)
        
    def remove_user(self, username: str):
        """Remove user from online list in Redis"""
        redis_client.srem('online_users', username)

    def get_online_users(self) -> list:
        """Get list of online users from Redis"""
        return list(redis_client.smembers('online_users'))
        
    def add_channel(self, channel_name: str):
        """Add a channel to Redis"""
        if not channel_name.startswith("#"):
            channel_name = "#" + channel_name
        redis_client.sadd('channels', channel_name)
        
    def get_channels(self) -> list:
        """Get list of channels from Redis"""
        return list(redis_client.smembers('channels'))
        
    def save_message(self, sender: str, content: str, recipient: str = "all", msg_type: str = "text", ttl: int = None):
        """Save a message to MongoDB and optionally set a TTL in Redis"""
        message_doc = {
            "sender": sender,
            "recipient": recipient, # 'all' for general chat, or specific username
            "content": content,
            "msg_type": msg_type,
            "timestamp": datetime.utcnow()
        }
        
        if ttl:
            message_doc["expires_at"] = message_doc["timestamp"] + timedelta(seconds=ttl)
            message_doc["ttl"] = ttl
            
        messages_collection.insert_one(message_doc)
        msg_id = str(message_doc["_id"])
        
        if ttl:
            # Store a key in Redis that expires after {ttl} seconds
            # Use a prefix to distinguish it from other keys
            redis_client.setex(f"msg_ttl:{msg_id}", ttl, "expire")
        
        # Increment message count for analytics
        redis_client.zincrby("user_message_counts", 1, sender)
        if recipient != "all":
            redis_client.zincrby("user_received_counts", 1, recipient)
            
        return message_doc

    def delete_message(self, message_id: str):
        """Delete a message from MongoDB by ID"""
        try:
            messages_collection.delete_one({"_id": ObjectId(message_id)})
            return True
        except Exception as e:
            print(f"Error deleting message {message_id}: {e}")
            return False

    def update_message(self, message_id: str, new_content: str, username: str) -> dict | None:
        """Update an existing message's content if the user is the sender"""
        try:
            obj_id = ObjectId(message_id)
        except:
            return None
            
        # First verify the user owns the message
        msg = messages_collection.find_one({"_id": obj_id, "sender": username})
        if not msg:
            return None
            
        # Update the message
        messages_collection.update_one(
            {"_id": obj_id},
            {"$set": {"content": new_content, "edited": True}}
        )
        
        # Return updated message
        updated_msg = messages_collection.find_one({"_id": obj_id})
        if updated_msg:
            updated_msg["_id"] = str(updated_msg["_id"])
            updated_msg["timestamp"] = updated_msg["timestamp"].isoformat()
            return updated_msg
        return None

    def get_messages(self, limit: int = 50) -> list:
        """Retrieve recent messages from MongoDB, filtering out expired ones"""
        # Filter: either no expires_at field, or expires_at is in the future
        now = datetime.utcnow()
        query = {
            "$or": [
                {"expires_at": {"$exists": False}},
                {"expires_at": {"$gt": now}}
            ]
        }
        cursor = messages_collection.find(query).sort("timestamp", -1).limit(limit)
        messages = list(cursor)
        # Convert ObjectId and datetime for JSON serialization
        for msg in messages:
            msg["_id"] = str(msg["_id"])
            msg["timestamp"] = msg["timestamp"].isoformat()
            if "expires_at" in msg:
                msg["expires_at"] = msg["expires_at"].isoformat()
        return messages[::-1] # return in chronological order

    def get_conversation(self, user1: str, user2: str, limit: int = 50) -> list:
        """Retrieve conversation between two specific users, filtering expired ones"""
        now = datetime.utcnow()
        query = {
            "$and": [
                {"$or": [
                    {"sender": user1, "recipient": user2},
                    {"sender": user2, "recipient": user1}
                ]},
                {"$or": [
                    {"expires_at": {"$exists": False}},
                    {"expires_at": {"$gt": now}}
                ]}
            ]
        }
        cursor = messages_collection.find(query).sort("timestamp", -1).limit(limit)
        messages = list(cursor)
        for msg in messages:
            msg["_id"] = str(msg["_id"])
            msg["timestamp"] = msg["timestamp"].isoformat()
            if "expires_at" in msg:
                msg["expires_at"] = msg["expires_at"].isoformat()
        return messages[::-1]

    def get_channel_messages(self, channel_name: str, limit: int = 50) -> list:
        """Retrieve conversation for a specific channel, filtering expired ones"""
        if not channel_name.startswith("#"):
            channel_name = "#" + channel_name
        
        now = datetime.utcnow()
        query = {
            "$and": [
                {"recipient": channel_name},
                {"$or": [
                    {"expires_at": {"$exists": False}},
                    {"expires_at": {"$gt": now}}
                ]}
            ]
        }
        cursor = messages_collection.find(query).sort("timestamp", -1).limit(limit)
        messages = list(cursor)
        for msg in messages:
            msg["_id"] = str(msg["_id"])
            msg["timestamp"] = msg["timestamp"].isoformat()
            if "expires_at" in msg:
                msg["expires_at"] = msg["expires_at"].isoformat()
        return messages[::-1]

    def get_analytics(self) -> dict:
        """Get analytics such as most active user from Redis/Mongo"""
        most_active_sender = redis_client.zrevrange("user_message_counts", 0, 0, withscores=True)
        most_solicited_user = redis_client.zrevrange("user_received_counts", 0, 0, withscores=True)
        
        return {
            "most_active_sender": most_active_sender[0] if most_active_sender else None,
            "most_solicited_user": most_solicited_user[0] if most_solicited_user else None,
            "total_messages": messages_collection.count_documents({})
        }

chat_manager = ChatManager()
