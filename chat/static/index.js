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

});





function defineNewChannelInput(channelNameInput) {
	channelNameInput.nextElementSibling.textContent = 'Create new channel';
	channelNameInput.setAttribute('name', 'channelname');
	channelNameInput.setAttribute('placeholder', 'Enter a channel name');

	channelNameInput.nextElementSibling.addEventListener('click', (event) => {

		event.preventDefault();
	});
}

function defineUsernameInput(usernameInput) {
	usernameInput.nextElementSibling.textContent = 'Enter';
	usernameInput.setAttribute('name', 'username');
	usernameInput.setAttribute('placeholder', 'Enter your name');
	
	usernameInput.nextElementSibling.addEventListener('click', (event) => {
		localStorage.setItem('username', usernameInput.value);
		usernameInput.value = '';

		//Turn the header form into the field for making a new channel
		defineNewChannelInput(usernameInput);

		event.preventDefault();
	},
	{once: true});
}