import { useState, useEffect, useRef } from "react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import ModelViewer from "../../components/Scene/ModelViewer";
import {
	MainContainer,
	ChatContainer,
	MessageList,
	Message,
	MessageInput,
	TypingIndicator
} from "@chatscope/chat-ui-kit-react";
import "./Chat.css";

const API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

function App() {
	const [isListening, setIsListening] = useState(false);
	const [typing, setTyping] = useState(false);
	const [messages, setMessages] = useState([
		{
			message: "Hey, welcome. Whats on your mind?",
			sender: "ChatGPT"
		}
	]);

	const handleSend = async (message) => {
		const newMessage = {
			message,
			direction: "outgoing",
			sender: "user"
		};

		const newMessages = [...messages, newMessage];

		setMessages(newMessages);

		// Initial system message to determine ChatGPT functionality
		// How it responds, how it talks, etc.
		setTyping(true);
		await processMessageToChatGPT(newMessages);
	};
	useEffect(() => {
		const recognition = new window.webkitSpeechRecognition();
		recognition.interimResults = true;

		const onResult = (e) => {
			const transcript = Array.from(e.results)
				.map((result) => result[0])
				.map((result) => result.transcript)
				.join("");

			// Here, you can set the transcript to your message state
			// setYourMessageState(transcript);
		};

		recognition.addEventListener("result", onResult);

		if (isListening) {
			recognition.start();
		} else {
			recognition.stop();
		}

		return () => {
			recognition.removeEventListener("result", onResult);
		};
	}, [isListening]);

	async function processMessageToChatGPT(chatMessages) {
		let apiMessages = chatMessages.map((messageObject) => {
			let role = "";
			if (messageObject.sender === "ChatGPT") {
				role = "assistant";
			} else {
				role = "user";
			}
			return { role: role, content: messageObject.message };
		});

		const systemMessage = {
			role: "system",
			content:
				"You are a therapist, your patient is troubled by something, you dont know what it is so be curious and engaging. Ask them questions about their issues, try to keep it to one question. reassure them, and sometimes offer a haiku or quote for inspiration."
		};

		const apiRequestBody = {
			model: "gpt-3.5-turbo",
			messages: [systemMessage, ...apiMessages]
		};

		try {
			const response = await fetch(
				"https://api.openai.com/v1/chat/completions",
				{
					method: "POST",
					headers: {
						Authorization: "Bearer " + API_KEY,
						"Content-Type": "application/json"
					},
					body: JSON.stringify(apiRequestBody)
				}
			);

			if (!response.ok) {
				throw new Error("API call failed with status " + response.status);
			}

			const data = await response.json();
			console.log(data);

			const responseMessage =
				data.choices?.[0]?.message?.content || "An error occurred.";
			const utterance = new SpeechSynthesisUtterance(responseMessage);
			utterance.rate = 1;
			utterance.volume = 1;
			speechSynthesis.speak(utterance);

			setMessages((prevMessages) => [
				...prevMessages,
				{
					message: responseMessage,
					sender: "ChatGPT"
				}
			]);
			setTyping(false);
		} catch (error) {
			console.error("ChatGPT API error:", error);

			setMessages((prevMessages) => [
				...prevMessages,
				{
					message: "Error: ChatGPT API call failed.",
					sender: "ChatGPT"
				}
			]);
			setTyping(false);
		}
	}

	return (
		<div className="App">
			<div className="modelView">
				<pointLight position={(5, 10, 5)} />
				<ModelViewer scale="100" modelPath={"/model/mansion.glb"} />
			</div>
			<div className="chat-backdrop">
				<MainContainer>
					<ChatContainer className="chat-container">
						<MessageList
							className="chat-history !important"
							scrollBehavior="smooth"
							typingIndicator={
								typing ? <TypingIndicator content="ChatGPT is typing" /> : null
							}
						>
							{messages.map((message, i) => {
								const messageClassName =
									message.sender === "user"
										? "user-message"
										: "assistant-message";
								return (
									<Message
										key={i}
										model={message}
										className={messageClassName}
									/>
								);
							})}
						</MessageList>
						<MessageInput
							className="chat-input"
							placeholder="Empezar a chatear (Start chatting...)"
							style={{
								"::placeholder": { color: "#d0d0db", important: "true" }
							}}
							onSend={handleSend}
							attachButton={false}
							sendButton={true} // Set this to true to show the send button
						/>
					</ChatContainer>
				</MainContainer>
				<button onClick={() => setIsListening((prevState) => !prevState)}>
					{isListening ? "Stop" : "Start"} Listening
				</button>
			</div>
		</div>
	);
}

export default App;
