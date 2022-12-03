'use strict';

chrome.runtime.onMessage.addListener((message) => {
	switch (message.action) {
		case 'search':
			chrome.storage.local.get({
				searchEngineURL: 'https://www.google.com/search?q='
			}, (options) => {
				chrome.tabs.create({
					url: options.searchEngineURL +
						encodeURIComponent(message.selectedString.replace(/\s+/g, ' ').trim())
				});
			});
			break;
		case 'copy':
			const body = document.body;
			const textarea = document.createElement('textarea');
			textarea.textContent = message.selectedString;
			body.appendChild(textarea);
			textarea.select();
			document.execCommand('copy');
			body.removeChild(textarea);
			break;
	}
});
