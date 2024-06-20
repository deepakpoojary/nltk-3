import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css"; // We'll move the CSS into a separate file
import html2pdf from "html2pdf.js"; // Import html2pdf.js
import { IoMdSend } from "react-icons/io";
import Slider from "react-slick";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTranslation } from "react-i18next";
import { FaPlay } from "react-icons/fa";
import { IoVolumeMedium } from "react-icons/io5";
import { IoMdVolumeOff } from "react-icons/io";
import CropSelector from "./MultipleSelectCrop";
import StateSelector from "./StateSelector";

import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import MultipleSelectCrop from "./MultipleSelectCrop";
import BasicSelect from "./StateSelector";
const icon = L.icon({
  iconUrl: "/marker-icon-2x.png",
  iconSize: [25, 41], // Size of the icon
  iconAnchor: [12, 41], // Point of the icon which will correspond to marker's location
  popupAnchor: [1, -34], // Point from which the popup should open relative to the iconAnchor
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  shadowSize: [41, 41],
});
const buttons1 = [
  "npkValuesSet",
  "nearestSoilTestCentre",
  "soilReport",
  "contactDetails",
  "soilHealthCard",
  "whatIsSHC",
];

const App = () => {
  const { t, i18n } = useTranslation(); // Hook to access translations

  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 2,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2500,
  };
  const settings1 = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 1, // Only display one slide
    slidesToScroll: 1, // Move only the current slide
    autoplay: false,
    autoplaySpeed: 2500,
  };

  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: t("messages.welcome"),
    },
  ]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [centers, setCenters] = useState([]);
  const [mapCenter, setMapCenter] = useState([0, 0]);
  const [themeColor, setThemeColor] = useState("--main-color");
  const [npkValues, setNpkValues] = useState({
    Nitrogen: "",
    Phosphorous: "",
    Potassium: "",
    Carbon: "",
    State: "",
    Crops: [],
  });
  // const [userInput, setUserInput] = useState("");
  const { transcript, resetTranscript } = useSpeechRecognition();
  const [listening, setListening] = useState(false);
  const [language, setLanguage] = useState("hi-IN");
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const handleLanguageChange1 = (event) => {
    i18n.changeLanguage(event.target.value);
    setLanguage(i18n.language);
  };
  useEffect(() => {
    if (transcript) {
      console.log("User speech:", transcript);
      setUserInput(transcript);
      // resetTranscript(); // Clear the transcript after processing
    }
  }, [transcript, resetTranscript]);

  useEffect(() => {
    setMessages([
      {
        sender: "bot",
        text: t("messages.welcome"),
      },
    ]);
  }, [i18n.language, t]);

  if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
    return <span>Your browser does not support speech recognition.</span>;
  }
  const toggleListening = () => {
    if (listening) {
      stopListening();
    } else {
      setLanguage(i18n.language);
      startListening();
    }
  };
  const startListening = () => {
    // setLanguage(i18n.language);
    resetTranscript();
    console.log("hii");
    setListening(true);
    SpeechRecognition.startListening({ continuous: true, language }); //here
  };

  const stopListening = () => {
    console.log("bye");
    setListening(false);
    SpeechRecognition.stopListening();
    setUserInput(transcript);
    sendMessage1(); // Trigger sendMessage after stopping listening
    resetTranscript();
    setUserInput("");
  };

  const chatlogRef = useRef(null);
  const sendMessage1 = async () => {
    // const translatedText = response.data.translatedText;
    // console.log("hi3424" + translatedText);

    if (!userInput) return;

    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: "User", text: userInput },
    ]);
    console.log(userInput);
    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/api/translate",
        { message: userInput, language: language },
        { headers: { "Content-Type": "application/json" } }
      );

      const data = response.data;
      // console.log(data.response?.getTestForPortal?.[0]?.html);
      // let combinedText = "Here are some suggestions:";
      if (data.response.suggestions) {
        let combinedText = "Here are some suggestions:";
        combinedText += " " + data.response.suggestions.join(", ");
        // print(combinedText);
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            sender: "Bot",
            text: "Here are some suggestions:", //this is what is getting audio from...
            buttons: data.response.suggestions,
          },
        ]);
      } else {
        const chatResponse =
          data.response.getTestForPortal?.[0]?.html || data.response;

        setMessages((prevMessages) => [
          ...prevMessages,
          {
            sender: "Bot",
            text: chatResponse,
            isHtml: !!data.response.getTestForPortal?.[0]?.html,
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching chat response:", error);
    } finally {
      setIsLoading(false);
      setUserInput("");
      // setTrans;
    }
  };
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
        "http://127.0.0.1:5000/api/translate", //here change later
        { message: userInput, language: language },
        { headers: { "Content-Type": "application/json" } }
      );

      const data = response.data;
      // console.log(data.response?.getTestForPortal?.[0]?.html);
      if (data.response.suggestions) {
        let combinedText = "Here are some suggestions:";
        combinedText += " " + data.response.suggestions.join(", ");
        // print(combinedText);
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            sender: "Bot",
            text: t("suggestions"),
            buttons: data.response.suggestions,
          },
        ]);
      } else {
        const chatResponse =
          data.response.getTestForPortal?.[0]?.html || data.response;

        setMessages((prevMessages) => [
          ...prevMessages,
          {
            sender: "Bot",
            text: chatResponse,
            isHtml: !!data.response.getTestForPortal?.[0]?.html,
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching chat response:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleButtonClick1 = async (option, language) => {
    setShowMap(false);
    const npkValuesSet = t("buttons.npkValuesSet");
    if (option === npkValuesSet) {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          sender: "User",
          text: option,
          // npkInput: true,
        },
        {
          sender: "Bot",
          text: t("enterValues"),
          npkInput: true,
        },
      ]);
      return;
    }
    const nearestSoilTestCentre = t("buttons.nearestSoilTestCentre");
    if (option === nearestSoilTestCentre) {
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
      // console.log("Button clicked:", option);
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "User", text: option },
      ]);
      setUserInput("");
      setIsLoading(true);
      try {
        const response = await axios.post(
          "http://127.0.0.1:5000/chat1",
          { message: option, language: language },
          { headers: { "Content-Type": "application/json" } }
        );

        const data = response.data;
        const chatResponse =
          data.response?.getTestForPortal?.[0]?.html || data.response;

        const message = {
          sender: "Bot",
          // text: chatResponse,
          isHtml: !!data.response?.getTestForPortal?.[0]?.html,
        };

        if (chatResponse.suggestions) {
          message.buttons = chatResponse.suggestions;
        } else {
          message.text = chatResponse;
        }

        setMessages((prevMessages) => [...prevMessages, message]);
      } catch (error) {
        console.error("Error fetching chat response:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };
  const handleNpkChange = (e, type) => {
    setNpkValues({ ...npkValues, [type]: e.target.value });
  };

  const handleNpkSubmit = async () => {
    setIsLoading(true);

    try {
      // const response = await axios.post(
      //   "http://127.0.0.1:5000/npk",
      //   // {
      //   //   message: `Nitrogen ${npkValues.Nitrogen}, Phosphorous ${npkValues.Phosphorous}, Potassium ${npkValues.Potassium},Carbon ${npkValues.Carbon},State ${npkValues.State},Crop ${npkValues.Crops}`,
      //   // },
      //   { headers: { "Content-Type": "application/json" } },
      //   { body: JSON.stringify(npkValues) }
      // );
      const response = await fetch("http://127.0.0.1:5000/npk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(npkValues), // Convert npkValues object to JSON string
      });

      // const data = response.data;
      const data = await response.json(); // Wait for response to be parsed as JSON
      console.log("Data sent to backend:", JSON.stringify(npkValues));
      console.log("Response from backend:", data);

      const chatResponse = data.response; // Extract response from data

      // Update state with new message
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          sender: "Bot",
          text: chatResponse,
        },
      ]);
    } catch (error) {
      console.error("Error fetching NPK response:", error);
    } finally {
      setIsLoading(false); // Clear loading state
      setNpkValues({ Nitrogen: "", Phosphorous: "", Potassium: "" }); // Reset form fields
    }
  };

  const handleButtonClick = async (option) => {
    setShowMap(false);
    if (option === "NPK values set") {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          sender: "User",
          text: "NPK values set",
          // npkInput: true,
        },
        {
          sender: "Bot",
          text: "Please enter the values for Nitrogen, Phosphorous, and Potassium:",
          npkInput: true,
        },
      ]);
      return;
    }

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
          "http://127.0.0.1:5000/chat1",
          { message: option },
          { headers: { "Content-Type": "application/json" } }
        );

        const data = response.data;
        const chatResponse =
          data.response?.getTestForPortal?.[0]?.html || data.response;

        const message = {
          sender: "Bot",
          // text: chatResponse,
          isHtml: !!data.response?.getTestForPortal?.[0]?.html,
        };

        if (chatResponse.suggestions) {
          message.buttons = chatResponse.suggestions;
        } else {
          message.text = chatResponse;
        }

        setMessages((prevMessages) => [...prevMessages, message]);
      } catch (error) {
        console.error("Error fetching chat response:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      if (Object.values(npkValues).some((val) => val)) {
        handleNpkSubmit();
      } else {
        sendMessage();
      }
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
  const handleThemeChange = (event) => {
    // Implement theme change logic here
    // For example, you can update CSS variables to change the theme
    // document.documentElement.style.setProperty("--main-color", color);
    const color = event.target.value;
    document.documentElement.style.setProperty(themeColor, color);
  };
  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };
  const speakText = async (text) => {
    // console.log(text);
    // const utterance = new SpeechSynthesisUtterance(text);
    // utterance.lang = language;
    // window.speechSynthesis.speak(utterance);
    try {
      const response = await axios.post("http://127.0.0.1:5000/api/tts", {
        text: text,
        languageCode: language,
      });
      const audioContent = response.data.audioContent;
      const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
      setIsPlaying(true);
      audio.play();
      setIsPlaying(false);
    } catch (error) {
      console.error("Error in text-to-speech:", error);
    }
  };
  const handleStopSpeech = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };
  const handleChangeState = (event) => {
    const { name, value } = event.target;
    setNpkValues({
      ...npkValues,
      [name]: value,
    });
  };
  const handleCropChange = (event) => {
    const { value } = event.target;
    // const crops = selectedOptions.map((option) => option.value); // Assuming selectedOptions is an array of selected options

    setNpkValues({
      ...npkValues,
      Crops: value,
    });
  };
  return (
    <div id="chatbox">
      <header className="header">
        <div>{t("chatbot")}</div>
        <div className="theme-picker">
          <label htmlFor="themeSelector">{t("themePicker.label")}</label>
          <select id="themeSelector" onChange={handleThemeChange}>
            <option value="#6dbb63">{t("themePicker.options.green")}</option>
            <option value="#ce93d8">{t("themePicker.options.purple")}</option>
          </select>
        </div>
        <div className="language-picker">
          <label htmlFor="languageSelector">{t("languagePicker.label")}</label>
          <select id="languageSelector" onChange={handleLanguageChange1}>
            <option value="hi-IN">{t("languagePicker.options.hi-IN")}</option>
            <option value="en">{t("languagePicker.options.en")}</option>

            <option value="kn-IN">{t("languagePicker.options.kn-IN")}</option>
            <option value="ta-IN">{t("languagePicker.options.ta-IN")}</option>
            <option value="te-IN">{t("languagePicker.options.te-IN")}</option>
            {/*<option value="ml-IN">Malayalam</option> 
            <option value="gu-IN">Gujarati</option>
            <option value="mr-IN">Marathi</option>
            <option value="bn-IN">Bengali</option>
            <option value="pa-IN">Punjabi</option>  */}
          </select>
        </div>
      </header>
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
                    {message.sender === "Bot" && (
                      <>
                        <button
                          onClick={() =>
                            speakText(
                              `${message.text}
                              ${
                                message.buttons
                                  ? message.buttons.join(", ")
                                  : ""
                              }
                              `
                            )
                          }
                          className="tts-button"
                        >
                          {isPlaying ? <IoVolumeMedium /> : <IoMdVolumeOff />}
                        </button>
                        <audio ref={audioRef} />
                      </>
                    )}
                  </>
                )}
                {message.buttons && (
                  <div className="button-slider">
                    {/* <Slider {...settings}> */}
                    {message.buttons.map((button, idx) => (
                      <div key={idx}>
                        <button
                          className="chat-button"
                          onClick={() =>
                            handleButtonClick1(t(`${button}`), i18n.language)
                          } //is this suggestion buttons
                        >
                          {button}
                        </button>
                      </div>
                    ))}
                    {/* </Slider> */}
                  </div>
                )}
                {message.npkInput && (
                  <div className="npk-inputs">
                    <div className="npk-input">
                      <br />
                      <label>{t("nitrogen")}</label>
                      <input
                        style={{
                          height: "20px",
                          borderRadius: "5px",
                          padding: "1px",
                        }}
                        type="number"
                        value={npkValues.Nitrogen}
                        onChange={(e) => handleNpkChange(e, "Nitrogen")}
                        placeholder="*value"
                      />
                    </div>
                    {/* <br /> */}
                    <div className="npk-input">
                      <label>{t("phosphorous")}</label>
                      <input
                        style={{
                          height: "20px",
                          borderRadius: "5px",
                          padding: "1px",
                        }}
                        type="number"
                        value={npkValues.Phosphorous}
                        onChange={(e) => handleNpkChange(e, "Phosphorous")}
                        placeholder="*value"
                      />
                    </div>
                    <div className="npk-input">
                      <label>{t("potassium")}</label>
                      <input
                        style={{
                          height: "20px",
                          borderRadius: "5px",
                          padding: "1px",
                        }}
                        type="number"
                        value={npkValues.Potassium}
                        onChange={(e) => handleNpkChange(e, "Potassium")}
                        placeholder="*value"
                      />
                    </div>
                    <div className="npk-input">
                      <label>{t("carbon")}</label>
                      <input
                        style={{
                          height: "20px",
                          borderRadius: "5px",
                          padding: "1px",
                        }}
                        type="number"
                        value={npkValues.Carbon}
                        onChange={(e) => handleNpkChange(e, "Carbon")}
                        placeholder="*value"
                      />
                    </div>
                    {/* <br /> */}

                    <StateSelector
                      selectedState={npkValues.State}
                      handleChange={handleChangeState}
                    />
                    <MultipleSelectCrop
                      selectedCrops={npkValues.Crops}
                      handleChange={handleCropChange}
                    />

                    <button onClick={handleNpkSubmit}>Submit</button>
                  </div>
                )}
              </p>
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
                onClick={() =>
                  handleButtonClick1(t(`buttons.${button}`), i18n.language)
                }
              >
                {/* {button.trim()} */}
                {t(`buttons.${button}`)}
              </button>
            </div>
          ))}
        </Slider>
      </div>
      <div id="userInputContainer">
        <input
          type="text"
          id="userInput"
          placeholder={t("inputPlaceholder")}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyPress}
        />

        <div id="chat-container">
          <button
            id="mic-button"
            onClick={toggleListening}
            style={{ backgroundColor: listening ? "red" : "transparent" }}
          >
            🎙️
          </button>

          <div id="chat-box"></div>
        </div>

        <IoMdSend className="custom-send-icon" onClick={sendMessage} />
      </div>
    </div>
  );
};

export default App;
