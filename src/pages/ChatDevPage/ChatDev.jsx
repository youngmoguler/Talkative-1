import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicrophone,
  faMicrophoneSlash,
} from "@fortawesome/free-solid-svg-icons";
import { faCog } from "@fortawesome/free-solid-svg-icons";
import * as userService from "../../utilities/users-service";
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
import "./ChatDev.css";

import soundFile from "./songs/coffeesong.mp3";

const API_KEY = "";

function App({ user, setUser }) {
  const audioRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [typing, setTyping] = useState(false);
  const [msg_box_val, set_msg_box_val] = useState("");
  const [volume, setVolume] = useState(0.1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [speakPitch, setSpeakPitch] = useState(1);
  const [speakVolume, setSpeakVolume] = useState(1);
  const [speakRate, setSpeakRate] = useState(1);
  const [speakVoice, setSpeakVoice] = useState("en-US");

  const [messages, setMessages] = useState([
    {
      message: `Hey ${user.name}, whats on your mind?`,
      sender: "ChatGPT",
    },
  ]);
  function utterance(content) {
    const voices = window.speechSynthesis.getVoices();
    const utter = new SpeechSynthesisUtterance(content);
    utter.volume = speakVolume;
    utter.pitch = speakPitch;
    utter.rate = speakRate;
    for (let i = 0; i < voices.length; i++) {
      if (voices[i].name === speakVoice) {
        utter.voice = voices[i];
        break;
      }
    }
    return utter;
  }
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.keyCode === 32 && document.activeElement !== "msg_box") {
        setIsListening(true);
      }
    }
    function handleKeyUp(e) {
      if (e.keyCode === 32 && document.activeElement.id !== "msg_box") {
        setIsListening(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keydown", handleKeyUp);
    };
  }, []);
  let tts = speechSynthesis;
  const voices = window.speechSynthesis.getVoices();
  const handleSend = async (message) => {
    const newMessage = {
      message,
      direction: "outgoing",
      sender: "user",
    };

    const newMessages = [...messages, newMessage];

    setMessages(newMessages);
    set_msg_box_val("");

    // Initial system message to determine ChatGPT functionality
    // How it responds, how it talks, etc.
    setTyping(true);
    await processMessageToChatGPT(newMessages);
  };

  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = volume;
    audio.onplaying = () => {
      setIsPlaying(true);
    };
    audio.onpause = () => {
      setIsPlaying(false);
    };
    audio.onended = () => {
      setIsPlaying(false);
    };
  }, [volume]);

  const playPauseAudio = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      const fadeAudio = setInterval(function () {
        if (audio.volume > 0.01) {
          audio.volume -= 0.01;
        } else {
          audio.pause();
          audio.volume = volume;
          clearInterval(fadeAudio);
        }
      }, 20);
    } else {
      audio.volume = 0;
      audio.play();
      const fadeAudio = setInterval(function () {
        if (audio.volume < volume) {
          audio.volume += 0.01;
        } else {
          clearInterval(fadeAudio);
        }
      }, 20);
    }
  };

  useEffect(() => {
    const recognition = new window.webkitSpeechRecognition();
    const findVoiceIndex = speechSynthesis
      .getVoices()
      .findIndex((voice) => voice.voiceURI === speakVoice);
    recognition.lang =
      findVoiceIndex === -1
        ? "en-US"
        : speechSynthesis.getVoices()[findVoiceIndex].lang;
    recognition.interimResults = true;
    recognition.continuous = false;
    let full_transcript = [];
    let full_processed = [];
    recognition.onstart = () => {
      console.log(`started`);
    };
    recognition.onend = () => {
      full_processed.push(full_transcript[full_transcript.length - 1]);
      console.log("Full processed: ", full_processed);
      set_msg_box_val(full_processed.join(" "));
      if (isListening) recognition.start();
    };
    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      full_transcript.push(transcript);
    };
    recognition.onerror = (e) => {
      console.log(`Error: ${e.error}`);
    };
    if (isListening) {
      console.log("Is listening: ", isListening);
      recognition.start();
      tts.cancel();
    } else {
      recognition.stop();
    }
    return () => {
      recognition.onend = null;
      recognition.stop();
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
        "You are not an AI, you are world class professional therapist named Dave who uses mind tricks to help guide a user to finding their own answers to their problems using examples. Be very casual, its important to make the patient feel like a friend over a patient. You are the therapist for the patient talking to you. Be a mature individual who talks to people like theyre your sons. Always ask why instead of assuming things. Be the support figure the patient is in need of.",
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
        setMessages([
          ...chatMessages,
          {
            message: data.choices[0].message.content,
            sender: "ChatGPT",
          },
        ]);

        tts.speak(utterance(data.choices[0].message.content));
        setTyping(false);
      });
  }

  return (
    <div className="App">
      {showSettings && (
        <div className="settings">
          <div>
            <h1>Text to Speech Config</h1>
            <hr className="solid" />
            <ul className="tts-settings-container">
              <li>
                <label htmlFor="volume">Volume:</label>
                <input
                  step="0.01"
                  name="volume"
                  type="range"
                  min="0"
                  max="1"
                  value={speakVolume}
                  onChange={(e) => {
                    setSpeakVolume(parseFloat(e.target.value));
                    console.log(
                      "Volume:",
                      e.target.value,
                      "Type:",
                      typeof e.target.value,
                      "useState:",
                      speakVolume,
                      "State Type:",
                      typeof speakVolume,
                      "isFinite && isFloat?",
                      [
                        isFinite(speakVolume),
                        Number(speakVolume) === speakVolume &&
                          speakVolume % 1 !== 0,
                      ]
                    );
                  }}
                />
              </li>
              <li>
                <label htmlFor="pitch">Pitch:</label>
                <input
                  step="0.01"
                  name="pitch"
                  type="range"
                  min="0"
                  max="2"
                  value={speakPitch}
                  onChange={(e) => {
                    setSpeakPitch(parseFloat(e.target.value));
                    console.log(
                      "Pitch:",
                      e.target.value,
                      "Type:",
                      typeof e.target.value,
                      "useState:",
                      speakPitch,
                      "State Type:",
                      typeof speakPitch,
                      "isFinite && isFloat?",
                      [
                        isFinite(speakPitch),
                        Number(speakPitch) === speakPitch &&
                          speakPitch % 1 !== 0,
                      ]
                    );
                  }}
                />
              </li>
              <li>
                <label htmlFor="Rate">Rate:</label>
                <input
                  step="0.01"
                  name="rate"
                  type="range"
                  min="0.1"
                  max="10"
                  value={speakRate}
                  onChange={(e) => {
                    setSpeakRate(parseFloat(e.target.value));
                    console.log(
                      "Rate:",
                      e.target.value,
                      "Type:",
                      typeof e.target.value,
                      "useState:",
                      speakRate,
                      "State Type:",
                      typeof speakRate,
                      "isFinite && isFloat?",
                      [
                        isFinite(speakRate),
                        Number(speakRate) === speakRate && speakRate % 1 !== 0,
                      ]
                    );
                  }}
                />
              </li>
              <li>
                <select
                  value={speakVoice}
                  onChange={(e) => {
                    setSpeakVoice(e.target.value);
                  }}
                >
                  {voices.map((voice, index) => {
                    return (
                      <option key={index} value={voice.voiceURI}>
                        {voice.name}
                      </option>
                    );
                  })}
                </select>
              </li>
            </ul>
          </div>
        </div>
      )}

      <div className="chat-backdrop">
        <FontAwesomeIcon
          className="settings-button"
          icon={faCog}
          size="lg"
          onClick={() => {
            setShowSettings(!showSettings);
            console.log(speakVolume, speakPitch, speakRate, speakVoice);
          }}
        />
        <MainContainer>
          <ChatContainer className="chat-container">
            <MessageList
              className="chat-history !important"
              scrollBehavior="smooth"
              typingIndicator={
                typing ? (
                  <TypingIndicator content="Therapist responding" />
                ) : null
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
              id="msg_box"
              className="chat-input"
              placeholder="Start chatting..."
              value={msg_box_val}
              style={{
                "::placeholder": { color: "#d0d0db", important: "true" },
              }}
              onSend={handleSend}
              attachButton={false}
              sendButton={true}
              sendDisabled={false}
              disabled={isListening}
              onChange={(e) => {
                set_msg_box_val(isListening ? msg_box_val : e);
              }}
            />
          </ChatContainer>
        </MainContainer>
        <div className="ui-container">
          <div
            className={`recording-indicator ${
              isListening ? "is-recording" : ""
            }`}
            onClick={() => setIsListening((prevState) => !prevState)}
          >
            <FontAwesomeIcon
              className="microphone-icon"
              icon={isListening ? faMicrophone : faMicrophoneSlash}
              size="lg"
            />
          </div>
          <audio ref={audioRef} src={soundFile} loop />
          <div className="music-ui">
            <button className="music-player-button" onClick={playPauseAudio}>
              {isPlaying ? "Turn off Jazz" : "Smooth Jazz"}
            </button>

            <input
              className="music-volume-slider"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
