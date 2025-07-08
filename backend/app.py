from  flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, emit, join_room
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
import os
from functools import wraps

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:1947@localhost/chatapp'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
socketio = SocketIO(app, cors_allowed_origins="*")
CORS(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Text, nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    sender = db.relationship('User', foreign_keys=[sender_id], backref='sent_messages')
    receiver = db.relationship('User', foreign_keys=[receiver_id], backref='received_messages')

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
        except:
            return jsonify({'message': 'Invalid token'}), 401
        return f(current_user, *args, **kwargs)
    return decorated
@app.route("/")
def index():
    return "Hello, this is working!"

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    
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
    
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.utcnow() + timedelta(days=30)
    }, app.config['SECRET_KEY'])
    
    return jsonify({
        'token': token,
        'user': {'id': user.id, 'username': user.username, 'email': user.email}
    })

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    
    if user and check_password_hash(user.password_hash, data['password']):
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(days=30)
        }, app.config['SECRET_KEY'])
        
        return jsonify({
            'token': token,
            'user': {'id': user.id, 'username': user.username, 'email': user.email}
        })
    
    return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/api/auth/validate', methods=['GET'])
@token_required
def validate_token(current_user):
    return jsonify({
        'user': {'id': current_user.id, 'username': current_user.username, 'email': current_user.email}
    })

@app.route('/api/users', methods=['GET'])
@token_required
def get_users(current_user):
    users = User.query.filter(User.id != current_user.id).all()
    return jsonify([
        {'id': user.id, 'username': user.username, 'email': user.email}
        for user in users
    ])

@app.route('/api/messages/<int:user_id>', methods=['GET'])
@token_required
def get_messages(current_user, user_id):
    messages = Message.query.filter(
        ((Message.sender_id == current_user.id) & (Message.receiver_id == user_id)) |
        ((Message.sender_id == user_id) & (Message.receiver_id == current_user.id))
    ).order_by(Message.timestamp).all()
    
    return jsonify([{
        'text': msg.text,
        'senderId': msg.sender_id,
        'receiverId': msg.receiver_id,
        'timestamp': msg.timestamp.isoformat()
    } for msg in messages])

@app.route('/api/messages', methods=['POST'])
@token_required
def send_message(current_user):
    data = request.get_json()
    
    message = Message(
        text=data['text'],
        sender_id=current_user.id,
        receiver_id=data['receiverId']
    )
    
    db.session.add(message)
    db.session.commit()
    
    return jsonify({'status': 'success'})

@socketio.on('join')
def on_join(user_id):
    join_room(f'user_{user_id}')

@socketio.on('message')
def handle_message(data):
    emit('message', data, room=f'user_{data["receiverId"]}')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    socketio.run(app, debug=True)
 