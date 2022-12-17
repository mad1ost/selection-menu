'use strict';

chrome.storage.local.get({
	styleFontFamily: 'sans-serif',
	searchButtonText: 'Search in Google',
	copyButtonText: 'Copy',
	enableDarkTheme: false
}, (options) => {
	let selectedString = '';
	const style = document.createElement('style');
	style.textContent = `
		#selection-menu {
			border-radius: 0;
			border-style: none;
			box-shadow: 0 2px 8px rgba(0,0,0,0.35);
			height: auto;
			line-height: normal;
			margin: 0;
			overflow: visible;
			padding: 0;
			position: fixed;
			width: auto;
			z-index: 99999;
		}
		#selection-menu:before {
			background-color: white;
			box-shadow: 0 2px 8px rgba(0,0,0,0.35);
			content: "";
			height: 11px;
			left: var(--arrow-left, 0);
			position: absolute;
			width: 11px;
			top: var(--arrow-top, 0);
			transform-origin: left top;
			transform: rotate(45deg);
		}
		#selection-menu ul {
			background-color: white;
			display: inline-block;
			list-style: none;
			margin: 0;
			padding: 3px 0;
			position: relative;
			white-space: nowrap;
		}
		#selection-menu li {
			border-right: 1px solid #ddd;
			display: inline-block;
			margin: 0;
			padding: 0 3px;
		}
		#selection-menu li:last-child {
			border-right: 0;
		}
		#selection-menu span {
			color: #222;
			cursor: default;
			display: inline-block;
			font-family: var(--selection-menu-font-family, ${options.styleFontFamily}), sans-serif;
			font-size: 13px;
			font-stretch: normal;
			font-style: normal;
			font-variant: normal;
			font-weight: normal;
			letter-spacing: normal;
			line-height: 18px;
			padding: 3px 7px;
			text-indent: 0;
			text-transform: none;
			word-spacing: normal;
		}
		#selection-menu span:hover {
			background-color: #8bb8dc;
		}
		#selection-menu.dark-theme:before {
			background-color: #2e2f38;
		}
		#selection-menu.dark-theme li {
			border-right-color: #43444c;
		}
		#selection-menu.dark-theme ul {
			background-color: #2e2f38;
		}
		#selection-menu.dark-theme span {
			color: #fff;
		}
		#selection-menu.dark-theme span:hover {
			background-color: #0078d6;
		}
	`;
	document.head.append(style);
	const selectionMenu = document.createElement('div');
	selectionMenu.id = 'selection-menu';
	selectionMenu.hidden = true;
	if (options.enableDarkTheme) selectionMenu.classList.add('dark-theme');
	const menuElement = document.createElement('ul');
	const searchButtonElement = addMenuItem(options.searchButtonText);
	const copyButtonElement = addMenuItem(options.copyButtonText);

	selectionMenu.append(menuElement);
	document.body.append(selectionMenu);

	function addMenuItem(text) {
		const menuItemElement = document.createElement('li');
		menuElement.append(menuItemElement);
		const textElement = document.createElement('span');
		textElement.textContent = text;
		menuItemElement.append(textElement);
		return textElement;
	}

	selectionMenu.addEventListener('mousedown', (event) => {
		event.preventDefault();
		event.stopPropagation();
	});

	selectionMenu.addEventListener('mouseup', (event) => {
		switch (event.target) {
			case searchButtonElement:
				chrome.runtime.sendMessage({
					action: 'search',
					selectedString: selectedString
				});
				selectionMenu.hidden = true;
				break;
			case copyButtonElement:
				if (navigator.clipboard) {
					navigator.clipboard.writeText(selectedString);
				} else {
					const body = document.body;
					const textarea = document.createElement('textarea');
					textarea.textContent = selectedString;
					body.append(textarea);
					textarea.select();
					document.execCommand('copy');
					body.removeChild(textarea);
				}
				selectionMenu.hidden = true;
				break;
		}
		event.stopPropagation();
	});

	selectionMenu.addEventListener('click', (event) => {
		event.stopPropagation();
	});

	chrome.storage.onChanged.addListener((changes, area) => {
		if (area !== 'local') return;
		for (let key in changes) {
			options[key] = changes[key].newValue;
		}
		selectionMenu.style.setProperty('--selection-menu-font-family', options.styleFontFamily);
		searchButtonElement.textContent = options.searchButtonText;
		copyButtonElement.textContent = options.copyButtonText;
		if (options.enableDarkTheme) {
			selectionMenu.classList.add('dark-theme');
		} else {
			selectionMenu.classList.remove('dark-theme');
		}
	});

	window.addEventListener('message', (event) => {
		if (event.source !== window.top) return;
		switch (event.data.action) {
			case 'show':
				if (!selectionMenu.hidden) return;
				selectionMenu.hidden = false;
				selectedString = event.data.selectedString;
				
				const onOneLine = event.data.onOneLine;
				const direction = event.data.selectionDirection;
				const selectionEnd = event.data.selectionEnd;
				const documentHeight = document.documentElement.clientHeight;
				const documentWidth = document.documentElement.clientWidth;
				const menuHeight = selectionMenu.offsetHeight;
				const menuWidth = selectionMenu.offsetWidth;
				const arrowHeight = 8; // px
				const arrowWidth = 16; // px
				
				let onTop = (onOneLine || direction === 'backward') ? true : false;
				
				// check bounds
				const topBound = selectionEnd.top - arrowHeight - menuHeight;
				const bottomBound = selectionEnd.bottom + arrowHeight + menuHeight;
				if (topBound < 0) {
					onTop = false;
				} else if (bottomBound > documentHeight) {
					onTop = true;
				}
				
				if (onTop) {
					selectionMenu.style.top = Math.min(documentHeight, selectionEnd.top) - arrowHeight - menuHeight + 'px';
				} else {
					selectionMenu.style.top = selectionEnd.bottom + arrowHeight + 'px';
				}
				
				let arrowLeft;
				if (selectionEnd.left + menuWidth/2 > documentWidth) {
					selectionMenu.style.left = documentWidth - menuWidth + 'px';
					arrowLeft = Math.min(menuWidth - (documentWidth - selectionEnd.left), menuWidth - arrowWidth/2);
				} else if (selectionEnd.left < menuWidth/2) {
					selectionMenu.style.left = 0 + 'px';
					arrowLeft = Math.max(arrowWidth/2, selectionEnd.left);
				} else {
					selectionMenu.style.left = selectionEnd.left - menuWidth/2 + 'px';
					arrowLeft = menuWidth/2;
				}
				
				selectionMenu.style.setProperty('--arrow-top', (onTop ? (menuHeight - arrowHeight) : -arrowHeight) + 'px');
				selectionMenu.style.setProperty('--arrow-left', arrowLeft + 'px');
				
				break;
			case 'hide':
				if (selectionMenu.hidden) return;
				selectionMenu.hidden = true;
				break;
		}
	});
});
