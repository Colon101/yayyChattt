import socketio
import threading
import time

# Replace 'http://your-server-address' with the actual server address
server_address = 'http://localhost:8080'
sio = socketio.Client()


def send_message(message_text):
    data = {'message_text': message_text}
    sio.emit('message_sent', data)


def stress_test(num_clients, messages_per_client):
    for i in range(num_clients):
        username = f'User{i+1}'
        for j in range(messages_per_client):
            message_text = f'This is a test message from {username} - {j+1}'
            send_message(message_text)
            time.sleep(0.1)  # Adjust sleep time as needed


if __name__ == '__main__':
    num_clients = 10  # Adjust the number of clients
    messages_per_client = 5  # Adjust the number of messages per client

    for i in range(num_clients):
        sio.connect(server_address)

    try:
        threads = []
        for i in range(num_clients):
            thread = threading.Thread(
                target=stress_test, args=(1, messages_per_client))
            threads.append(thread)
            thread.start()

        for thread in threads:
            thread.join()

    finally:
        for i in range(num_clients):
            sio.disconnect()
