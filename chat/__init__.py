import os

from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)



channels = [{
	'name': 'a',
	'messages': [{
				'name': 'anna',
				'text': 'hello',
				'time': '01:24'
				}]
}]


@app.route("/", methods=['GET', 'POST'])
def index():
	if request.method == 'POST':
		channel_name = request.data.decode('utf-8')
		for channel in channels:
			if channel['name'] == channel_name:
				return jsonify(error='The channel with this name exists, choose another name')
		
		channels.append({'name': channel_name, 'messages': []})
		return jsonify(success='The channel is created')
	
	return render_template('base.html', channels=channels)


@app.route("/<string:channel_name>")
def open_channel(channel_name):
	for channel in channels:
		if channel['name'] == channel_name:
			return render_template('chat.html', messages=channel['messages'])
	return ''