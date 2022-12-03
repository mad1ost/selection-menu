'use strict';

chrome.runtime.onMessage.addListener((message) => {
	if (message.action === 'search') {
		chrome.storage.local.get({
			searchEngineURL: 'https://www.google.com/search?q='
		}, (options) => {
			chrome.tabs.create({
				url: options.searchEngineURL +
					encodeURIComponent(message.selectedString.replace(/\s+/g, ' ').trim())
			});
		});
	}
});
