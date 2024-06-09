import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css"; // We'll move the CSS into a separate file
import html2pdf from "html2pdf.js"; // Import html2pdf.js
import { IoMdSend } from "react-icons/io";
import Slider from "react-slick";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
const icon = L.icon({
  iconUrl: "/public/marker-icon-2x.png",
  iconSize: [25, 41], // Size of the icon
  iconAnchor: [12, 41], // Point of the icon which will correspond to marker's location
  popupAnchor: [1, -34], // Point from which the popup should open relative to the iconAnchor
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  shadowSize: [41, 41],
});
const buttons1 = [
  "Nearest Soil test centre",
  "Soil report",
  "Contact Details",
  "Soil health card",
  "What is SHC",
];

const App = () => {
  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 2,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2500,
  };
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello, How can I help you ?",
    },
  ]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [centers, setCenters] = useState([]);
  const [mapCenter, setMapCenter] = useState([0, 0]);

  const chatlogRef = useRef(null);

  const sendMessage = async () => {
    if (!userInput) return;

    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: "User", text: userInput },
    ]);
    setUserInput("");
    setIsLoading(true);
    setShowMap(false);
    try {
      const response = await axios.post(
        "/chat",
        { message: userInput },
        { headers: { "Content-Type": "application/json" } }
      );

      const data = response.data;
      console.log(data.response?.getTestForPortal?.[0]?.html);
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
    setShowMap(false);
    if (option === "Nearest Soil test centre") {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              const response = await axios.post(
                "http://127.0.0.1:5000/getcenters",
                { latitude, longitude },
                { headers: { "Content-Type": "application/json" } }
              );
              setCenters(response.data);
              console.log(response);
              setMapCenter([latitude, longitude]);
              console.log([latitude, longitude]);
              setShowMap(true);
            } catch (error) {
              console.error("Error fetching nearest centers:", error);
            }
          },
          (error) => {
            console.error("Error getting user's location:", error);
          }
        );
      } else {
        console.error("Geolocation is not supported by this browser.");
      }
    } else {
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "User", text: option },
      ]);
      setUserInput("");
      setIsLoading(true);
      try {
        const response = await axios.post(
          "http://127.0.0.1:5000/chat",
          { message: option },
          { headers: { "Content-Type": "application/json" } }
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

  useEffect(() => {
    if (chatlogRef.current) {
      // Animate the scroll instead of setting it directly
      chatlogRef.current.scrollTo({
        top: chatlogRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  return (
    <div id="chatbox">
      <header>Chatbot</header>
      <div id="chatlog" ref={chatlogRef}>
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
                <span className="message-space"></span>
                {message.isHtml && (
                  <>
                    <div
                      className="html-frame"
                      style={{
                        transformOrigin: "top left",
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
      {showMap && (
        <div style={{ height: "200px", width: "100%", flexShrink: 0 }}>
          <MapContainer
            center={mapCenter}
            zoom={7}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {centers.map((center, idx) => (
              <Marker
                key={idx}
                position={[
                  center.region.geolocation.coordinates[1],
                  center.region.geolocation.coordinates[0],
                ]}
                icon={icon}
              >
                <Popup>
                  <div>
                    <h3>{center.name}</h3>
                    <p>{center.address}</p>
                    <p>{center.phone}</p>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${center.region.geolocation.coordinates[1]},${center.region.geolocation.coordinates[0]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Get Directions
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
      <div className="button-slider1">
        <Slider {...settings}>
          {buttons1.map((button, idx) => (
            <div key={idx} className="button-container">
              <button
                className="chat-button"
                onClick={() => handleButtonClick(button)}
              >
                {button.trim()}
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
    </div>
  );
};

export default App;
