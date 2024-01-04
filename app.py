from flask import Flask, request, jsonify, send_from_directory, render_template
from flask_socketio import SocketIO, emit
import sqlite3

app = Flask(__name__, template_folder="template")
app.config['SECRET_KEY'] = 'secret'
socketio = SocketIO(app)

# SQLite database setup
DB_NAME = "chat_database.db"


def create_table():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ChatMessages (
            MessageID INTEGER PRIMARY KEY AUTOINCREMENT,
            MessageText TEXT,
            Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    conn.commit()
    conn.close()


create_table()


@app.route('/')
def index():
    return render_template('index.html')


@socketio.on('message_sent')
def handle_message(data):
    # Remove leading and trailing spaces
    message_text = data['message_text'].strip()

    # Check if the message text is not just spaces
    if message_text:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO ChatMessages (MessageText)
            VALUES (?)
        ''', (message_text,))

        conn.commit()
        conn.close()
        print(data)
        socketio.emit('message_received', data)


@app.route('/get_messages')
def get_messages():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute('''
        SELECT * FROM ChatMessages
    ''')

    messages = cursor.fetchall()

    conn.close()

    return jsonify({"messages": messages})


if __name__ == '__main__':
    socketio.run(app, debug=True, port=8080, host="0.0.0.0")
