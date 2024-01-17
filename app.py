import time
from flask import Flask, make_response, request, jsonify, send_from_directory, render_template, send_file, flash, redirect, url_for, Blueprint,session,abort,Response
from datetime import timedelta
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_socketio import SocketIO, emit
from flask_minify import Minify
import sqlite3
from dotenv import load_dotenv
import os
load_dotenv()
app = Flask(__name__, template_folder="template")
app.config['SECRET_KEY'] = 'secret'
limiter = Limiter(app=app, key_func=get_remote_address)
socketio = SocketIO(app)
ADMIN = os.environ.get("ADMIN")
print(ADMIN)
# SQLite database setup
DB_NAME = "chat_database.db"
@app.route("/<path:path>")
@limiter.limit("2 per second")
def missing_handler(path):
    abort(404, "Not found %s" % path)

admin_bp = Blueprint("admin",__name__ ,template_folder="template/admin",url_prefix="/admin")
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
minify = Minify()
minify.init_app(app)
@admin_bp.route("/login", methods=["POST", "GET"])
def admin_login_page():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        if password == ADMIN and username == "admin":
            
            session['authenticated'] = True
            session.pop("was_flashed", None)  # Clear the was_flashed key
            return redirect(url_for('admin.admin_dashboard'))
        else:
            session["was_flashed"] = True

            flash('Invalid login credentials', 'error')

            return render_template("login.html")
    
    if session.get("authenticated"):
        return redirect(url_for('admin.admin_dashboard'))
    
    if session.get("was_flashed"):
        session.pop("was_flashed", None)  # Clear the was_flashed key
        session.pop('_flashes',None)
    
    return render_template("login.html")
@admin_bp.route("/clear_chat",methods=["GET"])
def clearchat():
    if session.get('authenticated'):
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM ChatMessages"
        )
        conn.commit()
        conn.close()
        socketio.emit("chatCleared")
        print("CLEARED")
        return Response(status=200)
    return Response(status=201)
@admin_bp.route("/")
def admin_dashboard():
    if session.get('authenticated'):
        # You can add any logic you need for the admin dashboard
        return render_template("admin.html")
    else:
        if session.get('logging_out') == False:
            flash('You need to log in first', 'error')
        session['logging_out'] = False
        return redirect(url_for('admin.admin_login_page'))
@app.route('/spinner.gif')
def spinner():
    file_path = 'Spinner.gif'

    # Check if the file exists
    if not os.path.isfile(file_path):
        return "File not found", 404

    # Get the file modification time for caching purposes
    file_mtime = os.path.getmtime(file_path)

    # Set cache control headers
    response = make_response(send_file(file_path, mimetype='image/gif'))
    response.headers['Cache-Control'] = 'public, max-age=31536000'  # Cache for 1 year (adjust as needed)
    response.headers['Last-Modified'] = time.strftime('%a, %d %b %Y %H:%M:%S GMT', time.gmtime(file_mtime))

    return response

@app.route('/',methods=["GET"])
def index():
    return render_template('index.html')
@admin_bp.route("log_out")
def logout():
    session['authenticated'] = False
    session['logging_out'] = True
    session.pop('_flashes',None)
    flash("logged out successfully","error")
    return Response(status=200)
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
    batch_size = 50
    offset = request.args.get('offset', default=0, type=int)

    if offset < 0:
        return jsonify({"error": "invalid request"}), 404

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute('''
        SELECT * FROM ChatMessages
        ORDER BY Timestamp DESC
        LIMIT ? OFFSET ?
    ''', (batch_size, offset * batch_size))

    messages = cursor.fetchall()

    conn.close()

    try:
        if len(messages) > 0:
            return jsonify({"messages": messages})
        else:
            return jsonify("EOF","EOF") ,404
    except Exception as e:
        return jsonify({"error": e.args}), 500

@app.route("/get_all_messages")
def get_all_messages():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute('''
        SELECT * FROM ChatMessages 
    ''')

    messages = cursor.fetchall()[::-1]

    conn.close()

    return jsonify({"messages": messages})
def split_array(arr, chunk_size=50):
    # Calculate the number of chunks and the size of the last chunk
    num_chunks = len(arr) // chunk_size
    last_chunk_size = len(arr) % chunk_size

    # Initialize an empty list to store the smaller arrays
    result = []

    # Iterate through the array and create subarrays
    for i in range(num_chunks):
        start_index = i * chunk_size
        end_index = start_index + chunk_size
        result.append(arr[start_index:end_index])

    # If there's a non-empty last chunk, add it to the result
    if last_chunk_size > 0:
        result.append(arr[-last_chunk_size:])

    return result
@app.route("/googleda02a14363e5ccd8.html")
def a():
    return "google-site-verification: googleda02a14363e5ccd8.html" ,200
app.register_blueprint(admin_bp)
app.permanent_session_lifetime = timedelta(hours=1)
if __name__ == '__main__':
    socketio.run(app, debug=True, host="0.0.0.0",port=80)
