from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, emit, join_room
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import jwt
from jwt import ExpiredSignatureError, InvalidTokenError
from datetime import datetime, timedelta
import os
from functools import wraps
import traceback
from math import radians, cos, sin, asin, sqrt



# --- App Setup ---
app = Flask(__name__, static_folder="dist", static_url_path="/")
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:1947@localhost/chatapp'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

db = SQLAlchemy(app)
socketio = SocketIO(app, cors_allowed_origins="*")
CORS(app)

# --- Serve React Build ---
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')


@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

# --- API Health Check ---
@app.route('/api/ping')
def ping():
    return jsonify({'status': 'ok'})

# --- Models ---
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    avatar_url = db.Column(db.Text, nullable=True)    # URL to profile picture
    about = db.Column(db.Text, nullable=True)         # "About me" or status line
    last_lat = db.Column(db.Float, nullable=True)
    last_lon = db.Column(db.Float, nullable=True)
    last_location_ts = db.Column(db.DateTime, nullable=True)
    is_visible_nearby = db.Column(db.Boolean, default=False)
    last_seen_visible = db.Column(db.Boolean, default=True)
    notifications = db.Column(db.Boolean, default=True)
    dark_mode = db.Column(db.Boolean, default=False)

class Contact(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    contact_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    status = db.Column(db.String(16), default='pending')  # 'pending', 'accepted', 'rejected'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship('User', foreign_keys=[user_id], backref='contact_requests')
    contact = db.relationship('User', foreign_keys=[contact_id])

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Text)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    type = db.Column(db.String(16), default='text')      # 'text', 'image', 'audio', 'file'
    url = db.Column(db.Text)
    filename = db.Column(db.Text)
    sender = db.relationship('User', foreign_keys=[sender_id], backref='sent_messages')
    receiver = db.relationship('User', foreign_keys=[receiver_id], backref='received_messages')

# --- JWT Token Decorator ---
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.filter_by(id=data['user_id']).first()
            if not current_user:
                return jsonify({'message': 'Invalid token'}), 401
        except ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401
        except Exception as e:
            print("JWT decode error:", e)
            traceback.print_exc()
            return jsonify({'message': f'Auth error: {str(e)}'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

# --- Nearby Users ---
def haversine(lat1, lon1, lat2, lon2):
    # Calculate the great-circle distance between two points on the Earth
    # using the Haversine formula
    r = 6371  # Radius of Earth in kilometers
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))
    return r * c
# --- User Profile Routes ---
@app.route('/api/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    return jsonify({
        'id': current_user.id,
        'username': current_user.username,
        'email': current_user.email,
        'avatar_url': current_user.avatar_url,
        'about': current_user.about,
    })

@app.route('/api/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    data = request.get_json()
    if 'username' in data:
        current_user.username = data['username']
    if 'about' in data:
        current_user.about = data['about']
    if 'avatar_url' in data:
        current_user.avatar_url = data['avatar_url']
    db.session.commit()
    return jsonify({'message': 'Profile updated'})

@app.route('/api/profile/avatar', methods=['POST'])
@token_required
def upload_avatar(current_user):
    if 'file' not in request.files:
        return jsonify({'message': 'No file uploaded'}), 400
    file = request.files['file']
    ext = os.path.splitext(file.filename)[1]
    filename = f"avatar_{current_user.id}{ext}"
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)
    url = f"/uploads/{filename}"
    current_user.avatar_url = url
    db.session.commit()
    return jsonify({'url': url})
@app.route('/api/profile/avatar', methods=['DELETE'])
@token_required
def delete_avatar(current_user):
    if current_user.avatar_url:
        try:
            os.remove(os.path.join(UPLOAD_FOLDER, current_user.avatar_url.split('/')[-1]))
            current_user.avatar_url = None
            db.session.commit()
            return jsonify({'message': 'Avatar deleted'})
        except Exception as e:
            print("Error deleting avatar:", e)
            return jsonify({'message': 'Error deleting avatar'}), 500
    return jsonify({'message': 'No avatar to delete'}), 404

# --- Auth Routes ---
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'All fields are required'}), 400
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already exists'}), 400
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': 'Username already exists'}), 400
    user = User(
        username=data['username'],
        email=data['email'],
        password_hash=generate_password_hash(data['password'])
    )
    db.session.add(user)
    db.session.commit()
    token = jwt.encode(
        {'user_id': user.id, 'exp': datetime.utcnow() + timedelta(days=30)},
        app.config['SECRET_KEY'],
        algorithm="HS256"
    )
    if isinstance(token, bytes):
        token = token.decode('utf-8')
    return jsonify({'token': token, 'user': {'id': user.id, 'username': user.username, 'email': user.email}})

@app.route('/api/auth/register', methods=['GET'])
def check_email_exists():
    email = request.args.get('email')
    if not email:
        return jsonify({'message': 'Email is required'}), 400
    user = User.query.filter_by(email=email).first()
    if user:
        return jsonify({'exists': True})
    return jsonify({'exists': False})



@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Email and password required'}), 400
    user = User.query.filter_by(email=data['email']).first()
    if user and check_password_hash(user.password_hash, data['password']):
        token = jwt.encode(
            {'user_id': user.id, 'exp': datetime.utcnow() + timedelta(days=30)},
            app.config['SECRET_KEY'],
            algorithm="HS256"
        )
        if isinstance(token, bytes):
            token = token.decode('utf-8')
        return jsonify({'token': token, 'user': {'id': user.id, 'username': user.username, 'email': user.email}})
    return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/api/auth/login', methods=['GET'])
def check_username_exists():
    username = request.args.get('username')
    if not username:
        return jsonify({'message': 'Username is required'}), 400
    user = User.query.filter_by(username=username).first()
    if user:
        return jsonify({'exists': True})
    return jsonify({'exists': False})

@app.route('/api/auth/logout', methods=['POST'])
@token_required
def logout(current_user):
    # For stateless JWT, logout is handled client-side by deleting the token
    return jsonify({'message': 'Logged out successfully'})



@app.route('/api/auth/validate', methods=['GET'])
@token_required
def validate_token(current_user):
    return jsonify({'user': {'id': current_user.id, 'username': current_user.username, 'email': current_user.email}})

# --- Contact System ---

@app.route("/api/contacts", methods=['GET'])
@token_required
def get_contacts(current_user):
    contacts = Contact.query.filter(
        ((Contact.user_id == current_user.id) | (Contact.contact_id == current_user.id)) &
        (Contact.status == 'accepted')
    ).all()
    contact_users = []
    for c in contacts:
        # Get the other user in this contact
        other = c.contact if c.user_id == current_user.id else c.user
        contact_users.append({'id': other.id, 'username': other.username, 'email': other.email})
    return jsonify(contact_users)

@app.route("/api/contacts/request", methods=['POST'])
@token_required
def send_contact_request(current_user):
    data = request.get_json()
    contact_id = data.get('contactId')
    if not contact_id or int(contact_id) == current_user.id:
        return jsonify({'message': 'Invalid contact'}), 400
    existing = Contact.query.filter_by(user_id=current_user.id, contact_id=contact_id).first()
    if existing:
        if existing.status == 'pending':
            return jsonify({'message': 'Request already sent'}), 409
        if existing.status == 'accepted':
            return jsonify({'message': 'Already friends'}), 409
    # Create both side for easier query
    req = Contact(user_id=current_user.id, contact_id=contact_id, status='pending')
    db.session.add(req)
    db.session.commit()
    return jsonify({'message': 'Contact request sent'})

@app.route("/api/contacts/pending", methods=['GET'])
@token_required
def pending_received(current_user):
    # Requests SENT TO this user needing approval
    reqs = Contact.query.filter_by(contact_id=current_user.id, status='pending').all()
    senders = [{'id': r.user.id, 'username': r.user.username, 'email': r.user.email} for r in reqs]
    return jsonify(senders)

@app.route("/api/contacts/accept", methods=['POST'])
@token_required
def accept_contact(current_user):
    data = request.get_json()
    sender_id = data.get('senderId')
    req = Contact.query.filter_by(user_id=sender_id, contact_id=current_user.id, status='pending').first()
    if not req:
        return jsonify({'message': 'Request not found'}), 404
    req.status = 'accepted'
    reverse = Contact.query.filter_by(user_id=current_user.id, contact_id=sender_id).first()
    if not reverse:
        db.session.add(Contact(user_id=current_user.id, contact_id=sender_id, status='accepted'))
    else:
        reverse.status = 'accepted'
    db.session.commit()
    return jsonify({'message': 'Contact accepted'})

@app.route("/api/users/search", methods=['GET'])
@token_required
def search_user(current_user):
    q = request.args.get('query', '')
    if not q:
        return jsonify({'message': 'Query required'}), 400
    user = User.query.filter(
        ((User.username == q) | (User.email == q)) & (User.id != current_user.id)
    ).first()
    if user:
        return jsonify({'id': user.id, 'username': user.username, 'email': user.email})
    return jsonify({})

# --- File Uploads ---
@app.route('/api/upload', methods=['POST'])
@token_required
def upload_file(current_user):
    if 'file' not in request.files:
        return jsonify({'message': 'No file uploaded'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'No file selected'}), 400
    ext = os.path.splitext(file.filename)[1]
    filename = f"{current_user.id}_{int(datetime.utcnow().timestamp())}{ext}"
    file_path = os.path.join(UPLOAD_FOLDER, secure_filename(filename))
    file.save(file_path)
    url = f"/uploads/{filename}"
    return jsonify({'url': url, 'name': file.filename})
@app.route('/api/upload/<filename>', methods=['DELETE'])
@token_required
def delete_file(current_user, filename):
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    if not os.path.exists(file_path):
        return jsonify({'message': 'File not found'}), 404
    try:
        os.remove(file_path)
        return jsonify({'message': 'File deleted'})
    except Exception as e:
        print("Error deleting file:", e)
        return jsonify({'message': 'Error deleting file'}), 500
    
# --- Nearby Users ---
@app.route('/api/users_nearby', methods=['GET'])
@token_required
def users_nearby(current_user):
    lat = request.args.get('lat', type=float)
    lon = request.args.get('lon', type=float)
    radius = request.args.get('r', default=100, type=float)  # In meters

    if lat is None or lon is None:
        return jsonify({'message': 'lat and lon required'}), 400

    # Get users who are visible, recently updated their location (e.g. in last 5 mins), and are not current user
    five_min_ago = datetime.utcnow() - timedelta(minutes=5)
    candidates = User.query.filter(
        User.id != current_user.id,
        User.is_visible_nearby == True,
        User.last_location_ts != None,
        User.last_location_ts > five_min_ago
    ).all()

    result = []
    for u in candidates:
        dist = haversine(lat, lon, u.last_lat, u.last_lon) if u.last_lat and u.last_lon else None
        if dist is not None and dist <= radius:
            result.append({
                'id': u.id,
                'username': u.username,
                'avatar_url': u.avatar_url,
                'distance': dist
            })
    return jsonify({'users': result})

@app.route('/api/nearby/update_location', methods=['POST'])
@token_required
def update_location(current_user):
    data = request.get_json()
    lat = data.get('lat')
    lon = data.get('lon')
    want_visible = data.get('visible', True)  # Allow user to opt-in/out

    if lat is None or lon is None:
        return jsonify({'message': 'Latitude and longitude required'}), 400

    current_user.last_lat = float(lat)
    current_user.last_lon = float(lon)
    current_user.last_location_ts = datetime.utcnow()
    current_user.is_visible_nearby = bool(want_visible)
    db.session.commit()
    return jsonify({'message': 'Location updated'})

# --- Messages ---
def is_accepted_contact(user_id, contact_id):
    contact = Contact.query.filter(
        (((Contact.user_id == user_id) & (Contact.contact_id == contact_id)) |
         ((Contact.user_id == contact_id) & (Contact.contact_id == user_id))) &
        (Contact.status == 'accepted')
    ).first()
    return bool(contact)

@app.route('/api/messages/<int:user_id>', methods=['GET'])
@token_required
def get_messages(current_user, user_id):
    if not is_accepted_contact(current_user.id, user_id):
        return jsonify([])  # empty, not allowed
    messages = Message.query.filter(
        ((Message.sender_id == current_user.id) & (Message.receiver_id == user_id)) |
        ((Message.sender_id == user_id) & (Message.receiver_id == current_user.id))
    ).order_by(Message.timestamp).all()
    return jsonify([{
        'text': msg.text,
        'senderId': msg.sender_id,
        'receiverId': msg.receiver_id,
        'timestamp': msg.timestamp.isoformat(),
        'type': msg.type,
        'url': msg.url,
        'filename': msg.filename
    } for msg in messages])

@app.route('/api/messages', methods=['POST'])
@token_required
def send_message(current_user):
    data = request.get_json()
    if not data or not data.get('receiverId'):
        return jsonify({'message': 'receiverId is required'}), 400
    receiver_id = data['receiverId']
    if not is_accepted_contact(current_user.id, receiver_id):
        return jsonify({'message': 'Not a contact'}), 403
    message = Message(
        text=data.get('text', ''),
        sender_id=current_user.id,
        receiver_id=receiver_id,
        type=data.get('type', 'text'),
        url=data.get('url'),
        filename=data.get('filename')
    )
    db.session.add(message)
    db.session.commit()
    # send via socket
    socketio.emit(
        'message',
        {
            'text': message.text,
            'senderId': message.sender_id,
            'receiverId': message.receiver_id,
            'timestamp': message.timestamp.isoformat(),
            'type': message.type,
            'url': message.url,
            'filename': message.filename,
        },
        room=f'user_{message.receiver_id}'
    )
    return jsonify({'status': 'success'})

# --- Settings ---
@app.route('/api/settings/<section>', methods=['POST'])
@token_required
def update_settings(current_user, section):
    data = request.get_json()
    if section == "privacy":
        current_user.last_seen_visible = data.get("lastSeenVisible", current_user.last_seen_visible)
    elif section == "notifications":
        current_user.notifications = data.get("notifications", current_user.notifications)
    elif section == "appearance":
        current_user.dark_mode = data.get("darkMode", current_user.dark_mode)
    db.session.commit()
    return jsonify({"status": "success"})

@app.route('/api/settings/<section>', methods=['GET'])
@token_required
def get_settings(current_user, section):
    if section == "privacy":
        return jsonify({
            "lastSeenVisible": current_user.last_seen_visible,
            "notifications": current_user.notifications
        })
    elif section == "appearance":
        return jsonify({
            "darkMode": current_user.dark_mode
        })
    return jsonify({'message': 'Invalid section'}), 400

# --- Socket.IO Setup ---
@socketio.on('connect')
def handle_connect():
    print("Client connected")
    # Optionally, you can send a welcome message or perform other actions
@socketio.on('disconnect')
def handle_disconnect():
    print("Client disconnected")
    # Optionally, you can handle cleanup or notify other users



# --- Socket.IO Events ---
@socketio.on('join')
def on_join(user_id):
    join_room(f'user_{user_id}')

@socketio.on('message')
def handle_message(data):
    emit('message', data, room=f'user_{data["receiverId"]}')

# --- Error Handlers ---
@app.errorhandler(404)
def not_found(error):
    return jsonify({'message': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'message': 'Internal server error'}), 500

@app.errorhandler(Exception)
def all_exception_handler(error):
    print("Unhandled exception:", error)
    traceback.print_exc()
    return jsonify({'message': 'Server error', 'error': str(error)}), 500

# --- Main Entrypoint ---
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    socketio.run(app, host='0.0.0.0', port=10000, debug=True)