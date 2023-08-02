import { useState, useEffect, useRef } from "react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
} from "@chatscope/chat-ui-kit-react";
import "./Chat.css"; // Import the CSS file with the provided styles

const API_KEY = "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";

function App() {
  const [isListening, setIsListening] = useState(false);
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState([
    {
      message: "Hey, welcome. Whats on your mind?",
      sender: "ChatGPT",
    },
  ]);

  const handleSend = async (message) => {
    const newMessage = {
      message,
      direction: "outgoing",
      sender: "user",
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
        "You are a therapist, your patient is troubled by something, you dont know what it is so be curious and engaging. Ask them questions about their issues, try to keep it to one question. reassure them, and sometimes offer a haiku or quote for inspiration.",
    };

    const apiRequestBody = {
      model: "gpt-3.5-turbo",
      messages: [systemMessage, ...apiMessages],
    };

    await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiRequestBody),
    })
      .then((data) => {
        return data.json();
      })
      .then((data) => {
        console.log(data);
        console.log(data.choices[0].message.content);
        setMessages([
          ...chatMessages,
          {
            message: data.choices[0].message.content,
            sender: "ChatGPT",
          },
        ]);
        setTyping(false);
      });
  }

  return (
    <div className="App">
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
                "::placeholder": { color: "#d0d0db", important: "true" },
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
