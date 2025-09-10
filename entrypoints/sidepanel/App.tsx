import React, { useEffect, useRef, useState } from 'react';
import './App.module.css';
import '../../assets/main.css'
import Sidebar, { SidebarType } from "@/entrypoints/sidebar.tsx";
import { browser } from "wxt/browser";
import ExtMessage, { MessageType } from "@/entrypoints/types.ts";
import { Button } from "@/components/ui/button.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Home } from "@/entrypoints/sidepanel/home.tsx";
import { SettingsPage } from "@/entrypoints/sidepanel/settings.tsx";
import { useTheme } from "@/components/theme-provider.tsx";
import { useTranslation } from 'react-i18next';
import Header from "@/entrypoints/sidepanel/header.tsx";
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default () => {
	const [showButton, setShowButton] = useState(true)
	const { theme, toggleTheme } = useTheme();
	const { t, i18n } = useTranslation();
	const [url, setURL] = useState<string>('');

	const iframeRef = useRef<HTMLIFrameElement>(null);

	async function initI18n() {
		let data = await browser.storage.local.get('i18n');
		if (data.i18n) {
			await i18n.changeLanguage(data.i18n)
		}
	}

	useEffect(() => {

		(async () => {
			await browser.declarativeNetRequest.updateSessionRules({
				removeRuleIds: [1],
				addRules: [{
					id: 1,
					priority: 1,
					action: {
						type: "modifyHeaders",
						responseHeaders: [
							{ header: "x-frame-options", operation: "remove" },
							{ header: "content-security-policy", operation: "remove" },
						],
					},
					condition: {
						urlFilter: "*",
						resourceTypes: ["main_frame", "sub_frame", "xmlhttprequest", "websocket"],
					},
				}],
			});
			// Get the iframe element
			if (!iframeRef.current) {
				return;
			}

			let iframe = iframeRef.current;
			// Wait for the iframe to load
			iframe.onload = () => {
				const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;

				// Create a style element
				const style = document.createElement('style');
				style.textContent = `
					body {
						background-color: lightblue;
					}
					h1 {
						color: red;
					}
	
					#below {
						background-color: red;
					}
				`;

				// Append the style element to the iframe's head
				iframeDocument?.head.appendChild(style);
			};
		})()

	}, [iframeRef])

	useEffect(() => {

		browser.storage.sync.get('activeUrl').then((data) => {

			if (data.activeUrl) {
				setURL(data.activeUrl)
				openweb(data.activeUrl)
			}
		});

		browser.runtime.onMessage.addListener((message: ExtMessage, sender, sendResponse) => {
			console.log('sidepanel:')
			console.log(message)
			if (message.messageType == MessageType.changeLocale) {
				i18n.changeLanguage(message.content)
			} else if (message.messageType == MessageType.changeTheme) {
				toggleTheme(message.content)
			}
		});

		initI18n();
	}, []);


	function actionGo() {
		var searchInput = url;
		if (searchInput != "") {
			// Check if the input is a valid URL
			// capture groups:
			// 1: protocol (https://)
			// 2: domain (mail.google.com)
			// 3: path (/chat/u/0/)
			// 4: query string (?view=list)
			// 5: fragment (#chat/home)
			var urlRegex = /^(https?:\/\/)?((?:[\da-z.-]+)+\.(?:[a-z.]{2,})+)?((?:\/[-a-z\d%_.~+]*)*)(\?[;&a-z\d%_.~+=-]*)?(#.*)?$/i;
			if (urlRegex.test(searchInput)) {
				// If it is a URL, navigate to the page
				if (searchInput.startsWith("http://www.") || searchInput.startsWith("https://www.")) {
					openweb(searchInput);
				} else if (searchInput.startsWith("http://") || searchInput.startsWith("https://")) {
					openweb(searchInput);
				} else {
					openweb("https://" + searchInput);
				}
			} else {
				if (searchInput.startsWith("file:///")) {
					openweb(searchInput);
				} else {
					// // If it is not a URL, perform a text search
					// performSearch(selectedsearch, searchInput);
				}
			}
		}
	}


	const openweb = async (currenturl: string) => {
		await browser.declarativeNetRequest.updateSessionRules({
			removeRuleIds: [1],
			addRules: [{
				id: 1,
				priority: 1,
				action: {
					type: "modifyHeaders",
					responseHeaders: [
						{ header: "x-frame-options", operation: "remove" },
						{ header: "content-security-policy", operation: "remove" },
					],
				},
				condition: {
					urlFilter: "*",
					resourceTypes: ["main_frame", "sub_frame", "xmlhttprequest", "websocket"],
				},
			}],
		});



		if (iframeRef && iframeRef.current) {
			// set active panel
			// open that web page
			iframeRef.current.src = currenturl;

			browser.storage.sync.set({ activeUrl: currenturl });
		}
	};


	return (
		<div className={cn(theme, 'h-full flex flex-col')}>
			<div className='flex flex-row gap-x-4 p-4'>
				<Input type="text" value={url} placeholder="Type something" onChange={(e) => {
					setURL(e.target.value)
				}} />
				<Button onClick={() => {
					actionGo();
				}}
				>
					Go
				</Button>
			</div>


			<iframe className='w-full h-full' ref={iframeRef}>

			</iframe>

		</div>

	)
};
