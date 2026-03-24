import pytest
from fastapi.testclient import TestClient
from main import app
from database import redis_client, messages_collection

client = TestClient(app)

def setup_module(module):
    """Setup any state specific to the execution of the given module."""
    # Clean DBs for testing
    redis_client.flushall()
    messages_collection.delete_many({})

def teardown_module(module):
    """Teardown any state that was previously setup with a setup_module method."""
    redis_client.flushall()
    messages_collection.delete_many({})

def test_websocket_chat():
    with client.websocket_connect("/ws/alice") as websocket_alice:
        # consume alice's connection broadcast
        websocket_alice.receive_json()
        
        # Check if alice is in online users
        res = client.get("/analytics")
        assert res.status_code == 200
        
        # Connect another user
        with client.websocket_connect("/ws/bob") as websocket_bob:
            # consume bob's connection broadcasts
            websocket_alice.receive_json()
            websocket_bob.receive_json()

            # Alice sends a message
            websocket_alice.send_json({"recipient": "all", "content": "Hello everyone!"})
            
            # Everyone receives it
            data_bob = websocket_bob.receive_json()
            assert data_bob["type"] == "message"
            assert data_bob["data"]["sender"] == "alice"
            assert data_bob["data"]["content"] == "Hello everyone!"
            
            data_alice = websocket_alice.receive_json()
            assert data_alice["type"] == "message"
            assert data_alice["data"]["content"] == "Hello everyone!"
            
            # Bob sends a private message to Alice
            websocket_bob.send_json({"recipient": "alice", "content": "Hi Alice!"})
            
            # Alice receives it
            data_alice = websocket_alice.receive_json()
            assert data_alice["type"] == "message"
            assert data_alice["data"]["sender"] == "bob"
            assert data_alice["data"]["content"] == "Hi Alice!"
            
            # Bob also receives his reflection message
            data_bob = websocket_bob.receive_json()
            assert data_bob["type"] == "message"
            assert data_bob["data"]["content"] == "Hi Alice!"

def test_rest_endpoints():
    res = client.get("/messages")
    assert res.status_code == 200
    messages = res.json()
    assert len(messages) == 2 # The two messages from previous test
    
    res = client.get("/conversation/alice/bob")
    assert res.status_code == 200
    conversation = res.json()
    assert len(conversation) == 1 # Only the private message
    assert conversation[0]["content"] == "Hi Alice!"

def test_analytics():
    res = client.get("/analytics")
    assert res.status_code == 200
    data = res.json()
    assert data["total_messages"] == 2
    # Alice sent 1 general msg, Bob sent 1 private msg. 
    # Let's just check the keys exist
    assert "most_active_sender" in data
    assert "most_solicited_user" in data
