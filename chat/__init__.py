import os

from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)



channels = {
	'a': [{'username': 'anna', 'text': 'hello', 'time': '01:24'}]
}


@app.route("/", methods=['GET', 'POST'])
def index():
	if request.method == 'POST':
		channel_name = request.data.decode('utf-8')
		if channel_name in channels:
			return jsonify(error='The channel with this name exists, choose another name')
		
		channels[channel_name] = []
		return jsonify(success='The channel is created')
	
	return render_template('base.html', channels=channels)


@app.route("/<string:channel_name>")
def open_channel(channel_name):
	if channel_name not in channels:
		return ''
	messages = channels[channel_name]
	
	return render_template('chat.html', messages=messages)


@socketio.on('new message')
def handle_message(data):
	username = data['username']
	text = data['text']
	date = data['date']
	channel_name = data['channel_name']
	
	message = {
		'username': username,
		'text': text,
		'time': date
	}

	if len(channels[channel_name]) > 99:
		channels[channel_name].pop(0)

	channels[channel_name].append(message)

	emit(f'announce message {channel_name}', {'username': username, 'text': text, 'date': date}, broadcast=True)