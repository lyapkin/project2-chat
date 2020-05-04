const socket = io(location.protocol + '//' + document.domain + ':' + location.port, {autoConnect: false});

document.addEventListener('DOMContentLoaded', () => {
	
	let headerInput = document.getElementById('header-form').firstElementChild;
	
	// Define what kind the header form is.
	if (localStorage.getItem('username')) {
		defineNewChannelInput(headerInput);
	} else {
		defineUsernameInput(headerInput);
	}


	// Turn on/off the header form button depending on the length of its value
	headerInput.addEventListener('input', function() {
		if (this.value.length > 0) {
			this.nextElementSibling.disabled = false;
		} else {
			this.nextElementSibling.disabled = true;
		}
	});



	document.getElementById('channel-list').addEventListener('click', openCloseChannel);



	socket.on('connect', () => {
		const form = document.forms.messageForm;
		
		form.sendButton.addEventListener('click', (event) => {
			const text = form.content.value;
			const username = localStorage.getItem('username');
			const date = Date.now();
			const channelName = form.parentElement.parentElement.firstElementChild.textContent;

			socket.emit('new message', {username, text, date, channel_name: channelName});

			form.content.value = '';

			event.preventDefault();
		});
	});


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
	openButton.insertAdjacentHTML('afterend', channelNode);
	openButton.dataset.open = 'true';
	openButton.textContent = 'Close';
}



function closeChannel(closeButton) {
	closeButton.nextElementSibling.remove();
	closeButton.dataset.open = 'false';
	closeButton.textContent = 'Open';
}



// Event handlers
function createNewChannel(event) {		
	fetch('/', {
		method: 'POST',
		body: event.target.previousElementSibling.value
	})
		.then(response => response.json())
		.then(result => {
			if ('success' in result) {
				// Add the new channel node
				let wrapper = document.createElement('div');
				let name = document.createElement('h2');
				let openButton = document.createElement('button');

				name.textContent = event.target.previousElementSibling.value;
				openButton.textContent = 'Open';
				openButton.dataset.open = 'false';
				openButton.dataset.channelName = event.target.previousElementSibling.value;
				event.target.previousElementSibling.value = '';

				wrapper.append(name);
				wrapper.append(openButton);

				document.querySelector('main').prepend(wrapper);

				openButton.dispatchEvent(new Event('click', {bubbles: true}));
			} else {
				// Show the error
				let error = document.createElement('div');
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
	// Put a received message into DOM
	const div = document.createElement('div');
	div.innerHTML = `<h3>${data.username}</h3><p>${data.text}</p><time>${data.date}</time>`;
	document.getElementById('messages').append(div);
}