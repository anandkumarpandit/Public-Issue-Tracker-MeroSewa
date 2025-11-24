import React, { useState, useEffect, useRef, useCallback } from "react";
import { complaintAPI } from "../services/api";
import "./Chatbot.css";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [conversationState, setConversationState] = useState("idle");
  const [complaintData, setComplaintData] = useState({});
  const [showPreview, setShowPreview] = useState(true);

  // Drag functionality
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addBotMessage(
        "👋 Hello! I'm your MeroSewa Complaint Assistant. How can I help you today?\n\n• File a complaint\n• Check complaint status\n• Get help"
      );
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (!showPreview && !isOpen) {
      const timer = setTimeout(() => {
        setShowPreview(true);
      }, 10000); // 10 seconds

      return () => clearTimeout(timer);
    }
  }, [showPreview, isOpen]);

  // Drag handlers
  const handleDragStart = (e) => {
    setIsDragging(true);
    const clientX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;
    setDragStart({
      x: clientX - position.x,
      y: clientY - position.y,
    });
  };

  const handleDragMove = useCallback((e) => {
    if (!isDragging) return;
    e.preventDefault();
    const clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;
    setPosition({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchmove", handleDragMove);
      window.addEventListener("touchend", handleDragEnd);
      return () => {
        window.removeEventListener("mousemove", handleDragMove);
        window.removeEventListener("mouseup", handleDragEnd);
        window.removeEventListener("touchmove", handleDragMove);
        window.removeEventListener("touchend", handleDragEnd);
      };
    }
  }, [isDragging, dragStart, handleDragMove, handleDragEnd]);

  const addBotMessage = (text) => {
    setMessages((prev) => [
      ...prev,
      { type: "bot", text, timestamp: new Date() },
    ]);
  };

  const addUserMessage = (text) => {
    setMessages((prev) => [
      ...prev,
      { type: "user", text, timestamp: new Date() },
    ]);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userInput = inputValue.trim();
    addUserMessage(userInput);
    setInputValue("");

    processUserInput(userInput);
  };

  const processUserInput = (input) => {
    const lowerInput = input.toLowerCase();

    // Idle state - determine user intent
    if (conversationState === "idle") {
      if (
        lowerInput.includes("file") ||
        lowerInput.includes("complaint") ||
        lowerInput.includes("report") ||
        lowerInput.includes("problem")
      ) {
        setConversationState("ask_name");
        addBotMessage(
          "Let's file your complaint. First, what is your full name?"
        );
      } else if (
        lowerInput.includes("status") ||
        lowerInput.includes("check") ||
        lowerInput.includes("track")
      ) {
        setConversationState("ask_complaint_id");
        addBotMessage("Please provide your Complaint ID (e.g., CMP1234567890)");
      } else if (lowerInput.includes("help")) {
        addBotMessage(
          "I can help you with:\n\n1. Filing a new complaint\n2. Checking complaint status\n3. General information\n\nOffice Hours: Mon-Fri, 9 AM - 5 PM\nHelpline: 1234567890\n\nWhat would you like to do?"
        );
      } else {
        addBotMessage(
          "I can help you:\n• File a complaint\n• Check complaint status\n• Get help\n\nPlease choose one."
        );
      }
      return;
    }

    // Complaint filing flow - collect all required fields
    if (conversationState === "ask_name") {
      setComplaintData((prev) => ({ ...prev, personName: input }));
      setConversationState("ask_phone");
      addBotMessage("Thank you! What is your phone number?");
      return;
    }

    if (conversationState === "ask_phone") {
      const phoneRegex = /^[0-9]{10}$/;
      if (phoneRegex.test(input.replace(/\s/g, ""))) {
        setComplaintData((prev) => ({
          ...prev,
          phone: input.replace(/\s/g, ""),
        }));
        setConversationState("ask_email");
        addBotMessage(
          "What is your email address? (Type 'skip' if you don't want to provide)"
        );
      } else {
        addBotMessage("Please enter a valid 10-digit phone number.");
      }
      return;
    }

    if (conversationState === "ask_email") {
      if (lowerInput === "skip") {
        setComplaintData((prev) => ({ ...prev, email: "" }));
      } else {
        setComplaintData((prev) => ({ ...prev, email: input }));
      }
      setConversationState("ask_ward");
      addBotMessage("What is your ward number? (1-50)");
      return;
    }

    if (conversationState === "ask_ward") {
      const wardNum = parseInt(input);
      if (wardNum >= 1 && wardNum <= 50) {
        setComplaintData((prev) => ({ ...prev, wardNumber: wardNum }));
        setConversationState("ask_location_method");
        addBotMessage(
          "How would you like to provide your location?\n\n1. Auto-detect location (click button below)\n2. Enter manually (latitude, longitude)"
        );
      } else {
        addBotMessage("Please enter a valid ward number between 1 and 50.");
      }
      return;
    }

    if (conversationState === "ask_location_method") {
      if (lowerInput.includes("auto") || lowerInput === "1") {
        detectLocation();
      } else if (lowerInput.includes("manual") || lowerInput === "2") {
        setConversationState("ask_manual_location");
        addBotMessage(
          "Please enter your location:\n• Area name (e.g., Guntur, Neerukonda)\n• Or coordinates: latitude, longitude"
        );
      } else {
        addBotMessage("Please choose:\n1. Auto-detect\n2. Manual entry");
      }
      return;
    }

    if (conversationState === "ask_manual_location") {
      const coords = input.split(",").map((s) => s.trim());

      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        setComplaintData((prev) => ({
          ...prev,
          location: `${coords[0]}, ${coords[1]}`,
          latitude: coords[0],
          longitude: coords[1],
        }));
      } else {
        setComplaintData((prev) => ({
          ...prev,
          location: input,
          latitude: null,
          longitude: null,
        }));
      }

      setConversationState("ask_address");
      addBotMessage("Please provide your full address.");
      return;
    }

    if (conversationState === "ask_address") {
      setComplaintData((prev) => ({ ...prev, address: input }));
      setConversationState("ask_complaint_type");
      addBotMessage(
        "What type of problem do you want to report?\n\n• Water\n• Electricity\n• Road\n• Garbage\n• Street Light\n• Drainage\n• Pollution\n• Others"
      );
      return;
    }

    if (conversationState === "ask_complaint_type") {
      setComplaintData((prev) => ({ ...prev, complaintType: input }));
      setConversationState("ask_priority");
      addBotMessage(
        "What is the priority level?\n\n• Low\n• Medium\n• High\n• Emergency"
      );
      return;
    }

    if (conversationState === "ask_priority") {
      const validPriorities = ["low", "medium", "high", "emergency"];
      if (validPriorities.includes(lowerInput)) {
        setComplaintData((prev) => ({
          ...prev,
          priority:
            input.charAt(0).toUpperCase() + input.slice(1).toLowerCase(),
        }));
        setConversationState("ask_title");
        addBotMessage("Please provide a short title for your complaint.");
      } else {
        addBotMessage("Please choose: Low, Medium, High, or Emergency");
      }
      return;
    }

    if (conversationState === "ask_title") {
      setComplaintData((prev) => ({ ...prev, title: input }));
      setConversationState("ask_description");
      addBotMessage("Please provide a detailed description of the problem.");
      return;
    }

    if (conversationState === "ask_description") {
      setComplaintData((prev) => ({ ...prev, description: input }));
      setConversationState("ask_incident_date");
      addBotMessage(
        "When did this incident occur? (Format: YYYY-MM-DD or type 'today')"
      );
      return;
    }

    if (conversationState === "ask_incident_date") {
      let incidentDate;
      if (lowerInput === "today") {
        incidentDate = new Date().toISOString().split("T")[0];
      } else {
        incidentDate = input;
      }

      setComplaintData((prev) => {
        const updatedData = { ...prev, incidentDate };
        setTimeout(() => showComplaintSummary(updatedData), 0);
        return updatedData;
      });
      return;
    }

    if (conversationState === "confirm_complaint") {
      if (lowerInput.includes("yes") || lowerInput.includes("confirm")) {
        submitComplaint();
      } else if (lowerInput.includes("no") || lowerInput.includes("cancel")) {
        resetConversation();
        addBotMessage("Complaint cancelled. How else can I help you?");
      } else {
        addBotMessage("Please reply 'yes' to confirm or 'no' to cancel.");
      }
      return;
    }

    if (conversationState === "ask_complaint_id") {
      checkComplaintStatus(input);
      return;
    }
  };

  const detectLocation = () => {
    if (navigator.geolocation) {
      addBotMessage("Detecting your location...");
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            // Use reverse geocoding to get location name
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            );
            const data = await response.json();

            const address = data.address || {};
            const locationParts = [];

            if (address.suburb || address.neighbourhood) {
              locationParts.push(address.suburb || address.neighbourhood);
            }
            if (address.city || address.town || address.village) {
              locationParts.push(
                address.city || address.town || address.village
              );
            }
            if (address.state) {
              locationParts.push(address.state);
            }

            const locationName =
              locationParts.length > 0
                ? locationParts.join(", ")
                : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

            setComplaintData((prev) => ({
              ...prev,
              location: locationName,
              latitude,
              longitude,
            }));

            addBotMessage(`Location detected: ${locationName}`);
            setConversationState("ask_address");
            addBotMessage("Please provide your full address.");
          } catch (error) {
            const locationCoords = `${latitude.toFixed(4)}, ${longitude.toFixed(
              4
            )}`;
            setComplaintData((prev) => ({
              ...prev,
              location: locationCoords,
              latitude,
              longitude,
            }));
            addBotMessage(`Location detected: ${locationCoords}`);
            setConversationState("ask_address");
            addBotMessage("Please provide your full address.");
          }
        },
        (error) => {
          addBotMessage(
            "Could not detect location. Please enter manually:\nFormat: Area name or latitude, longitude"
          );
          setConversationState("ask_manual_location");
        }
      );
    } else {
      addBotMessage(
        "Location detection not supported. Please enter manually:\nFormat: Area name or latitude, longitude"
      );
      setConversationState("ask_manual_location");
    }
  };

  const showComplaintSummary = (data) => {
    const summary = `📋 Complaint Summary:\n\nName: ${data.personName
      }\nPhone: ${data.phone}\nEmail: ${data.email || "Not provided"}\nWard: ${data.wardNumber
      }\nLocation: ${data.location}\nAddress: ${data.address}\nType: ${data.complaintType
      }\nPriority: ${data.priority}\nTitle: ${data.title}\nDescription: ${data.description
      }\nIncident Date: ${data.incidentDate
      }\n\nIs this correct? Reply 'yes' to submit or 'no' to cancel.`;
    addBotMessage(summary);
    setConversationState("confirm_complaint");
  };

  const submitComplaint = async () => {
    addBotMessage("Submitting your complaint...");

    console.log("Submitting complaint with data:", complaintData);

    try {
      const formData = new FormData();
      formData.append("personName", complaintData.personName);
      formData.append("phone", complaintData.phone);
      formData.append("email", complaintData.email || "");
      formData.append("wardNumber", complaintData.wardNumber);
      formData.append("location", complaintData.location);
      formData.append("address", complaintData.address);
      formData.append("complaintType", complaintData.complaintType);
      formData.append("priority", complaintData.priority);
      formData.append("title", complaintData.title);
      formData.append("description", complaintData.description);
      formData.append("incidentDate", complaintData.incidentDate);

      const response = await complaintAPI.submitComplaint(formData);

      if (response.data.success) {
        const complaintNumber = response.data.data.complaintNumber;
        addBotMessage(
          `✅ Complaint submitted successfully!\n\nYour Complaint ID: ${complaintNumber}\n\nPlease save this ID to track your complaint.`
        );
        resetConversation();
      } else {
        addBotMessage(
          "Failed to submit complaint. Please try again or use the complaint form."
        );
        resetConversation();
      }
    } catch (error) {
      console.error("Chatbot submission error:", error);
      addBotMessage(
        "Error submitting complaint. Please try the complaint form instead."
      );
      resetConversation();
    }
  };

  const checkComplaintStatus = async (complaintId) => {
    addBotMessage("Checking complaint status...");

    try {
      const response = await complaintAPI.trackComplaint(complaintId);

      if (response.data.success) {
        const complaint = response.data.data;
        const statusMsg = `📊 Complaint Status:\n\nID: ${complaint.complaintNumber
          }\nType: ${complaint.complaintType}\nStatus: ${complaint.status
          }\nPriority: ${complaint.priority}\nSubmitted: ${new Date(
            complaint.createdAt
          ).toLocaleDateString()}\n\n${complaint.resolutionNotes ? "Notes: " + complaint.resolutionNotes : ""
          }`;
        addBotMessage(statusMsg);
      } else {
        addBotMessage(
          "Complaint not found. Please check the ID and try again."
        );
      }
    } catch (error) {
      addBotMessage("Error checking status. Please try again.");
    }

    resetConversation();
  };

  const resetConversation = () => {
    setConversationState("idle");
    setComplaintData({});
  };

  const handleQuickAction = (action) => {
    if (action === "file") {
      addUserMessage("File a complaint");
      setConversationState("ask_name");
      addBotMessage(
        "Let's file your complaint. First, what is your full name?"
      );
    } else if (action === "status") {
      addUserMessage("Check complaint status");
      setConversationState("ask_complaint_id");
      addBotMessage("Please provide your Complaint ID (e.g., CMP1234567890)");
    } else if (action === "location") {
      detectLocation();
    }
  };

  return (
    <>
      {/* Preview Message Bubble */}
      {!isOpen && showPreview && (
        <div className="chatbot-preview">
          How can I help you? 💬
          <button
            className="preview-close"
            onClick={(e) => {
              e.stopPropagation();
              setShowPreview(false);
            }}
            aria-label="Close preview"
          >
            ✕
          </button>
        </div>
      )}

      {/* Floating Chat Button */}
      <button
        className={`chatbot-toggle ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle chatbot"
      >
        {isOpen ? "✕" : "💬"}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className="chatbot-window"
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
            cursor: isDragging ? "grabbing" : "default",
          }}
        >
          <div
            className="chatbot-header"
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            style={{ cursor: isDragging ? "grabbing" : "grab" }}
          >
            <h3>🏛️ MeroSewa Assistant</h3>
            <button onClick={() => setIsOpen(false)} className="chatbot-close">
              ✕
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.type}`}>
                <div className="message-content">{msg.text}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {conversationState === "ask_location_method" && (
            <div className="chatbot-quick-actions">
              <button
                onClick={() => handleQuickAction("location")}
                className="quick-btn"
              >
                📍 Auto-detect Location
              </button>
            </div>
          )}

          {conversationState === "idle" && messages.length > 1 && (
            <div className="chatbot-quick-actions">
              <button
                onClick={() => handleQuickAction("file")}
                className="quick-btn"
              >
                📝 File Complaint
              </button>
              <button
                onClick={() => handleQuickAction("status")}
                className="quick-btn"
              >
                🔍 Check Status
              </button>
            </div>
          )}

          <div className="chatbot-input">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type your message..."
            />
            <button onClick={handleSend} disabled={!inputValue.trim()}>
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
