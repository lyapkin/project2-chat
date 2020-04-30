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

		if (toggleButton.dataset.open == 'false') {
			// Open a channel. Loads an HTML block and put into DOM
			const channelName = toggleButton.previousElementSibling.textContent;
			fetch(`/${channelName}`)
				.then(response => response.text())
				.then(result => {
					const wrapper = document.createElement('div');
					wrapper.innerHTML = result;
					toggleButton.after(wrapper);
					toggleButton.dataset.open = 'true';
					toggleButton.textContent = 'Close';
					localStorage.setItem('channel', channelName);
				});
		} else if (toggleButton.dataset.open == 'true') {
			// Close a channel
			toggleButton.nextElementSibling.remove();
			toggleButton.dataset.open = 'false';
			toggleButton.textContent = 'Open';
			localStorage.removeItem('channel');
		}

	}
}