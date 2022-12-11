'use strict';

chrome.storage.local.get({
	styleFontFamily: 'sans-serif',
	searchButtonText: 'Search in Google',
	copyButtonText: 'Copy'
}, (options) => {
	let selectedString = '';
	const selectionMenu = createSelectionMenu(options);
	selectionMenu.hidden = true;
	document.body.appendChild(selectionMenu);

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
				
				selectionMenu.style.setProperty('--arrow', onTop ? 'var(--arrow-down)' : 'var(--arrow-up)');
				selectionMenu.style.setProperty('--arrow-top', (onTop ? menuHeight : -arrowHeight*2) + 'px');
				selectionMenu.style.setProperty('--arrow-left', arrowLeft + 'px');
				
				break;
			case 'hide':
				if (selectionMenu.hidden) return;
				selectionMenu.hidden = true;
				break;
		}
	});
	
	function createSelectionMenu(options) {
		const selectionMenu = document.createElement('div');
		const shadowRoot = selectionMenu.attachShadow({
			mode: 'closed'
		});
		const style = document.createElement('style');
		style.textContent = `
			:host {
				--arrow-down: white transparent transparent transparent;
				--arrow-up: transparent transparent white transparent;
				--arrow: var(--arrow-down);
				background: transparent none repeat scroll 0% 0% !important;
				border-radius: 0 !important;
				border-style: none !important;
				box-shadow: none !important;
				filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35)) !important;
				font-family: sans-serif !important;
				font-size: medium !important;
				font-stretch: normal !important;
				font-style: normal !important;
				font-variant: normal !important;
				font-weight: normal !important;
				height: auto !important;
				letter-spacing: normal !important;
				line-height: normal !important;
				margin: 0 !important;
				overflow: visible !important;
				padding: 0 !important;
				position: fixed !important;
				text-indent: 0 !important;
				text-transform: none !important;
				width: auto !important;
				word-spacing: normal !important;
				z-index: 99999 !important;
			}
			:host:after {
				border-color: var(--arrow) !important;
				border-style: solid !important;
				border-width: 8px !important;
				content: "" !important;
				height: 0 !important;
				left: var(--arrow-left, 50%) !important;
				margin-left: -8px !important;
				pointer-events: none !important;
				position: absolute !important;
				width: 0 !important;
				top: var(--arrow-top, 100%) !important;
			}
			ul {
				background-color: white;
				display: inline-block;
				list-style: none;
				margin: 0;
				padding: 3px 0;
				white-space: nowrap;
			}
			li {
				border-right: 1px solid #ddd;
				display: inline-block;
				padding: 0 3px;
			}
			li:last-child {
				border-right: 0;
			}
			span {
				color: #222;
				cursor: default;
				display: inline-block;
				font-family: var(--menu-font-family, sans-serif);
				font-size: 13px;
				line-height: 18px;
				padding: 3px 7px;
			}
			span:hover {
				background-color: #8bb8dc;
			}`;
		shadowRoot.appendChild(style);
		selectionMenu.style.setProperty('--menu-font-family', options.styleFontFamily);
		let menuElement;
		const searchButtonElement = addMenuItem(options.searchButtonText);
		const copyButtonElement = addMenuItem(options.copyButtonText);
		
		shadowRoot.appendChild(menuElement);
		
		shadowRoot.addEventListener('mousedown', (event) => {
			event.preventDefault();
			event.stopPropagation();
		});
		
		shadowRoot.addEventListener('mouseup', (event) => {
			switch (event.target) {
				case searchButtonElement:
					chrome.runtime.sendMessage({
						action: 'search',
						selectedString: selectedString
					});
					selectionMenu.hidden = true;
					break;
				case copyButtonElement:
					const body = document.body;
					const textarea = document.createElement('textarea');
					textarea.textContent = selectedString;
					body.appendChild(textarea);
					textarea.select();
					document.execCommand('copy');
					body.removeChild(textarea);
					selectionMenu.hidden = true;
					break;
			}
			event.stopPropagation();
		});
		
		shadowRoot.addEventListener('click', (event) => {
			event.stopPropagation();
		});
		
		function addMenuItem(text) {
			if (!menuElement) {
				menuElement = document.createElement('ul');
			}
			const menuItemElement = document.createElement('li');
			menuElement.appendChild(menuItemElement);
			const textElement = document.createElement('span');
			textElement.textContent = text;
			menuItemElement.appendChild(textElement);
			return textElement;
		}
		
		return selectionMenu;
	}
});
