const socket = io(location.protocol + '//' + document.domain + ':' + location.port, {autoConnect: false});

document.addEventListener('DOMContentLoaded', () => {
	
	let headerInput = document.getElementById('header-form').firstElementChild;
	
	// Define what kind the header form is.
	if (localStorage.getItem('username')) {
		defineNewChannelInput(headerInput);
	} else {
		defineUsernameInput(headerInput);
	}


	// Turn on/off the header form button depending on the length of the form's value
	headerInput.addEventListener('input', switchButton);


	
	socket.on('connect', () => {
		let timerId;

		const form = document.forms.messageForm;

		// Turn on/off the message form button depending on the length of the form's value
		form.content.addEventListener('input', switchButton);
		
		form.sendButton.addEventListener('click', (event) => {
			const text = form.content.value;
			const username = localStorage.getItem('username');
			const channelName = form.parentElement.parentElement.firstElementChild.firstElementChild.textContent;

			if (username) {
				socket.emit('new message', {username, text, channel_name: channelName});

				form.content.value = '';
				form.sendButton.disabled = true;
			} else {
				clearTimeout(timerId);
				const flash = form.lastElementChild;
				flash.hidden = false;
				timerId = setTimeout(() => flash.hidden = true, 4000);
			}
			
			event.preventDefault();
		});
	});



	document.getElementById('channel-list').addEventListener('click', openCloseChannel);



	const channel = localStorage.getItem('channel');
	if (channel) {
		document.querySelector(`[data-channel-name="${channel}"]`).dispatchEvent(new Event('click', {bubbles: true}));
	}
	
});





function defineNewChannelInput(channelNameInput) {
	channelNameInput.nextElementSibling.textContent = 'Create new channel';
	channelNameInput.setAttribute('name', 'channelname');
	channelNameInput.setAttribute('placeholder', 'Enter a channel name');

	channelNameInput.nextElementSibling.addEventListener('click', createNewChannel);
}



function defineUsernameInput(usernameInput) {
	usernameInput.nextElementSibling.textContent = 'Enter';
	usernameInput.setAttribute('name', 'username');
	usernameInput.setAttribute('placeholder', 'Enter your name');
	
	usernameInput.nextElementSibling.addEventListener('click', (event) => {
		localStorage.setItem('username', usernameInput.value);
		usernameInput.value = '';

		// Turn the header form into the field for making a new channel
		defineNewChannelInput(usernameInput);

		event.preventDefault();
	},
	{once: true});
}



function openChannel(openButton, channelNode) {
	openButton.parentElement.insertAdjacentHTML('afterend', channelNode);
	openButton.dataset.open = 'true';
	openButton.closest('.channel').classList.add('open');
	openButton.textContent = 'Close';

	const meesages = openButton.parentElement.parentElement.lastElementChild;

	// Makes the time readable
	const times = messages.getElementsByTagName('time');
	for (let item of times) {
		item.textContent = new Date(item.textContent).toTimeString().slice(0, 5);
	}

	messages.scrollTop = messages.scrollHeight;
}



function closeChannel(closeButton) {
	closeButton.parentElement.nextElementSibling.remove();
	closeButton.dataset.open = 'false';
	closeButton.closest('.channel').classList.remove('open');
	closeButton.textContent = 'Open';
}



// Event handlers
function createNewChannel(event) {
	const channelName = event.target.previousElementSibling.value.trim();

	fetch('/', {
		method: 'POST',
		body: channelName
	})
		.then(response => response.json())
		.then(result => {
			if (result.success) {
				event.target.previousElementSibling.value = '';

				// Add the new channel node
				const channel = document.createElement('div');
				channel.className = 'channel';

				const channelHeader = document.createElement('div');
				channelHeader.className = 'channel__header';

				const name = document.createElement('h2');
				name.textContent = channelName;

				const openButton = document.createElement('button');
				openButton.textContent = 'Open';
				openButton.dataset.open = 'false';
				openButton.dataset.channelName = channelName;

				channelHeader.append(name);
				channelHeader.append(openButton);
				channel.append(channelHeader);
				document.querySelector('#channel-list').prepend(channel);

				// Open the channel
				openButton.dispatchEvent(new Event('click', {bubbles: true}));
			} else {
				// Show the error
				const error = document.createElement('div');
				error.className = 'flash';
				error.textContent = result.error;
				document.querySelector('header').prepend(error);
				setTimeout(() => error.remove(), 5000);
			}
			
		});
	
	event.preventDefault();
}



function openCloseChannel(event) {
	if(event.target.tagName == 'BUTTON') {
	
		const toggleButton = event.target;
		const channelName = toggleButton.previousElementSibling.textContent;

		if (toggleButton.dataset.open == 'false') {
			// Open a channel. Loads an HTML block and put into DOM
			fetch(`/${channelName}`)
				.then(response => response.text())
				.then(channelNode => {
					openChannel(toggleButton, channelNode);

					// To remember in which channel a user was when the page was closed 
					localStorage.setItem('channel', channelName);

					socket.connect();

					socket.on(`announce message ${channelName}`, receiveMessage);

				});
		} else if (toggleButton.dataset.open == 'true') {
			// Close a channel
			socket.disconnect();
			socket.removeListener(`announce message ${channelName}`, receiveMessage);

			closeChannel(toggleButton);

			localStorage.removeItem('channel');
		}

	}
}



function receiveMessage(data) {
	const date = new Date(data.date).toTimeString().slice(0, 5);

	// Put a received message into DOM
	const message = document.createElement('div');
	message.className = 'message';
	message.innerHTML = `<h3>${data.username}</h3><p>${data.text}</p><time>${date}</time>`;

	const messages = document.getElementById('messages');
	messages.append(message);

	messages.scrollTop = messages.scrollHeight;
}


// Turn on/off a relative form button depending on the length of the form's value
function switchButton() {
	if (this.value.length > 0) {
		this.nextElementSibling.disabled = false;
	} else {
		this.nextElementSibling.disabled = true;
	}
}