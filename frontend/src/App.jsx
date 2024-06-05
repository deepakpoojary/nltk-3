import React, { useState } from "react";
import axios from "axios";
import "./App.css"; // We'll move the CSS into a separate file
import html2pdf from "html2pdf.js"; // Import html2pdf.js
import { IoMdSend } from "react-icons/io";
import Slider from "react-slick";
// import "slick-carousel/slick/slick.css";
// import "slick-carousel/slick/slick-theme.css";
const buttons1 = [
  "Soil report",
  "Contact Details",
  "Soil health card",
  "What is SHC",
];
const App = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 2,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
  };
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello, How can I help you ?",
      // buttons: [
      //   "Get your soil report",
      //   "Soil health card",
      //   "What is SHC",
      //   "Contact Details",
      // ],
    },
    // {
    //   sender: "bot",
    //   // text: "",
    //   buttons: ["Soil report ", "suggestions", "Soil health card", "Questions"],
    // },
  ]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!userInput) return;

    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: "User", text: userInput },
    ]);
    setUserInput("");
    setIsLoading(true);
    try {
      const response = await axios.post(
        "https://dialogflow-dev.krishitantra.com/backend/chat",
        { message: userInput },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = response.data;
      const chatResponse =
        data.response?.getTestForPortal?.[0]?.html || data.response;

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          sender: "Bot",
          text: chatResponse,
          isHtml: !!data.response?.getTestForPortal?.[0]?.html,
        },
      ]);
    } catch (error) {
      console.error("Error fetching chat response:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleButtonClick = async (option) => {
    // if (!userInput) return;

    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: "User", text: option },
    ]);
    setUserInput("");
    setIsLoading(true);
    try {
      const response = await axios.post(
        "https://dialogflow-dev.krishitantra.com/backend/chat",
        { message: option },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = response.data;
      const chatResponse =
        data.response?.getTestForPortal?.[0]?.html || data.response;

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          sender: "Bot",
          text: chatResponse,
          isHtml: !!data.response?.getTestForPortal?.[0]?.html,
        },
      ]);
    } catch (error) {
      console.error("Error fetching chat response:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      sendMessage();
    }
  };

  const handleDownload = () => {
    setIsLoading(true); // Show loading symbol while downloading

    const htmlMessages = messages.filter((message) => message.isHtml);
    const htmlMessage = htmlMessages[htmlMessages.length - 1];
    if (htmlMessage) {
      const element = document.createElement("div");
      element.innerHTML = htmlMessage.text;
      element.style.width = "7.5in"; // Set width to standard US letter size
      element.style.height = "10in";

      const opt = {
        margin: 0.5,
        filename: "html_content.pdf",
        image: { type: "jpeg", quality: 1 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      };

      html2pdf()
        .from(element)
        .set(opt)
        .save()
        .then(() => {
          setIsLoading(false); // Hide loading symbol after download completes
        });
    }
  };
  const getScaleFactor = () => {
    return Math.min(window.innerWidth / 650, 1);
  };
  return (
    <div id="chatbox">
      <header>Chatbot</header>
      <div id="chatlog">
        <ul style={{ paddingLeft: "5px" }}>
          {messages.map((message, index) => (
            <li key={index} className={`chat ${message.sender}`}>
              <p className="bubble-this">
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "20px" }}
                >
                  {message.sender === "User" ? "face" : "smart_toy"}
                </span>

                {/* <strong>{message.sender}:</strong> */}
                <span className="message-space"></span>
                {message.isHtml && (
                  <>
                    <div
                      className="html-frame"
                      style={{
                        // transform: `scale(${getScaleFactor()})`,
                        transformOrigin: "top left",
                        // backgroundColor: "white",
                      }}
                    >
                      <span
                        dangerouslySetInnerHTML={{ __html: message.text }}
                      />
                    </div>
                    <button className="thisbutton" onClick={handleDownload}>
                      Download PDF
                    </button>
                  </>
                )}
                {!message.isHtml && message.text && (
                  <>
                    <span>{message.text}</span>
                  </>
                )}
              </p>
              {message.buttons && (
                <div className="button-slider">
                  <Slider {...settings}>
                    {message.buttons.map((button, idx) => (
                      <div key={idx}>
                        <button
                          className="chat-button"
                          onClick={() => handleButtonClick(button)}
                        >
                          {button}
                        </button>
                      </div>
                    ))}
                  </Slider>
                </div>
              )}
            </li>
          ))}
        </ul>
        {isLoading && (
          <p>
            <strong>Bot:</strong> Loading...
          </p>
        )}
      </div>
      <div className="button-slider1">
        <Slider {...settings}>
          {buttons1.map((button, idx) => (
            <div key={idx} className="button-container">
              {/* Improved button styling with semantic class and hover effect */}
              <button
                className="chat-button"
                onClick={() => handleButtonClick(button)}
              >
                {button.trim()}{" "}
                {/* Remove trailing spaces for better display */}
              </button>
            </div>
          ))}
        </Slider>
      </div>
      <div id="userInputContainer">
        <input
          type="text"
          id="userInput"
          placeholder="Type your message here"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <IoMdSend className="custom-send-icon" onClick={sendMessage} />
      </div>

      {/* {!isLoading && (
        <button className="thisbutton" onClick={fetchHtmlContent}>
          Fetch HTML Content
        </button>
      )} */}
    </div>
  );
};

export default App;
