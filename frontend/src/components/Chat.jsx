import { useState, useEffect, useRef, useMemo } from "react";
import { socketService } from "../services/socket.js"; // Also add extension for your services

// Add the .jsx extension to all your component imports
import ContactAvatar from "./ContactAvatar.jsx";
import SidebarContact from "./SidebarContact.jsx";
import PendingRequests from "./PendingRequests.jsx";
import AddContactModal from "./AddContactModal.jsx";
import MessageBubble from "./MessageBubble.jsx";
import ProfileModal from "./Profile.jsx";
import Nearby from "./Nearby.jsx";
import SettingsModal from "./Setting.jsx";
import FilePreviewModal from "./FilePreviewModal.jsx";

export default function Chat({ user, setUser }) {
  const [contacts, setContacts] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [showAddContact, setShowAddContact] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showNearby, setShowNearby] = useState(false);
  const chatScrollRef = useRef(null);
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null); // Ref to detect clicks outside the dropdown
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const attachmentMenuRef = useRef(null);
  const uniqueContacts = useMemo(
    () => Array.from(new Map(contacts.map((u) => [u.id, u])).values()),
    [contacts]
  );
  const imageInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [previewFile, setPreviewFile] = useState(null); // { file, url, type }
  const [closePreview, setClosePreview] = useState(false);

  useEffect(() => {
    fetch("/api/contacts", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((data) => setContacts(Array.isArray(data) ? data : []));
    fetch("/api/contacts/pending", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((data) => setPendingRequests(Array.isArray(data) ? data : []));
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetch(`/api/messages/${selectedUser.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
        .then((res) => res.json())
        .then((messages) =>
          setMessages(Array.isArray(messages) ? messages : [])
        );
    }
  }, [selectedUser]);

  useEffect(() => {
    if (chatScrollRef.current)
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [messages, selectedUser]);

  useEffect(() => {
    socketService.connect(user.id);
    socketService.onMessage((newMsg) => {
      if (
        selectedUser &&
        ((newMsg.senderId === user.id &&
          newMsg.receiverId === selectedUser.id) ||
          (newMsg.senderId === selectedUser.id &&
            newMsg.receiverId === user.id))
      ) {
        setMessages((prev) => [...prev, newMsg]);
      }
    });
    return () => socketService.disconnect();
  }, [user.id, selectedUser]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        attachmentMenuRef.current &&
        !attachmentMenuRef.current.contains(event.target)
      ) {
        setShowAttachmentMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [attachmentMenuRef]);

  const handleSend = async () => {
    if (!text.trim() || !selectedUser) return;
    const message = { text, receiverId: selectedUser.id };
    const timestamp = new Date().toISOString();
    await fetch("/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(message),
    });
    setMessages((prev) => [
      ...prev,
      { ...message, senderId: user.id, receiverId: selectedUser.id, timestamp },
    ]);
    setText("");
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Determine the file type for the preview
    const fileType = file.type.startsWith("image/") ? "image" : "document";

    // Set the state to show the preview modal
    setPreviewFile({
      file: file,
      url: URL.createObjectURL(file), // Create a temporary URL for the browser to display
      type: fileType,
    });

    // Reset the file input so the user can select the same file again if needed
    if (e.target) {
      e.target.value = null;
    }
  };

  const handleSendWithPreview = async (file, caption) => {
    if (!file || !selectedUser) return;

    // 1. Upload the file to the backend
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: formData,
    });
    const data = await res.json();
    if (!data.url) {
      alert("File upload failed.");
      return;
    }

    // 2. Construct the message object
    const message = {
      receiverId: selectedUser.id,
      type: file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
        ? "video"
        : "file",
      url: data.url,
      filename: data.name || file.name,
      text: caption, // Add the caption here
    };

    // 3. Send the message to the backend
    await fetch("/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(message),
    });

    // 4. Update local state and close the preview
    setMessages((prev) => [
      ...prev,
      {
        ...message,
        senderId: user.id,
        timestamp: new Date().toISOString(),
      },
    ]);
    setPreviewFile(null); // Close the modal
  };
  const handleFilePreview = (file) => {
    const url = URL.createObjectURL(file);
    const type = file.type.startsWith("image/")
      ? "image"
      : file.type.startsWith("video/")
      ? "video"
      : "file";
    setPreviewFile({ file, url, type });
  };
  const handleClosePreview = () => {
    if (previewFile && previewFile.url) {
      URL.revokeObjectURL(previewFile.url);
    }
    setPreviewFile(null);
  };
  const handleStartRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Recording not supported on this device.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new window.MediaRecorder(stream);
      let audioChunks = [];
      mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        if (selectedUser) {
          const formData = new FormData();
          formData.append("file", audioBlob, `voice_note_${Date.now()}.webm`);
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: formData,
          });
          const data = await res.json();
          if (data.url) {
            const msg = {
              type: "audio",
              url: data.url,
              filename: data.name,
              receiverId: selectedUser.id,
              text: "",
            };
            await fetch("/api/messages", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: JSON.stringify(msg),
            });
            setMessages((prev) => [
              ...prev,
              {
                ...msg,
                senderId: user.id,
                receiverId: selectedUser.id,
                timestamp: new Date().toISOString(),
              },
            ]);
          }
        }
        setRecorder(null);
        setIsRecording(false);
      };
      mediaRecorder.start();
      setRecorder(mediaRecorder);
      setIsRecording(true);
    } catch {
      alert("Could not access microphone");
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    recorder && recorder.stop();
    setIsRecording(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    socketService.disconnect();
  };
  const handleSettings = () => {
    setShowSettings(true);
  };

  return (
    <div className="flex h-screen bg-white md:bg-[#f6f7fb] md:rounded-2xl md:shadow-lg overflow-hidden md:border md:border-gray-200">
      {/* Sidebar */}
      <aside
        className={`min-w-[280px] w-full md:w-1/3 bg-white border-r flex flex-col transition-transform duration-300 ease-in-out ${
          selectedUser ? "-translate-x-full md:translate-x-0" : "translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between px-6 pt-7 pb-5 border-b">
          <span className="font-semibold text-xl text-gray-900">
            {showNearby ? "Nearby Users" : "Contacts"}
          </span>
          <div className="flex gap-2">
            <button
              title={showNearby ? "Show Contacts" : "Show Nearby Users"}
              className="p-1 rounded hover:bg-gray-100"
              onClick={() => setShowNearby((v) => !v)}
            >
              {showNearby ? (
                <svg width={20} height={20} fill="none" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="#4F8EF7"
                    strokeWidth="2"
                  />
                  <path
                    d="M8 15h8"
                    stroke="#4F8EF7"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg width={20} height={20} fill="none" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="3"
                    stroke="#4F8EF7"
                    strokeWidth="2"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="#4F8EF7"
                    strokeWidth="2"
                  />
                </svg>
              )}
            </button>
            {!showNearby && (
              <button
                onClick={() => setShowAddContact(true)}
                className="p-1 rounded hover:bg-gray-100"
                title="Add Contact"
              >
                <svg width={20} height={20} fill="none" viewBox="0 0 24 24">
                  <path
                    d="M12 5v14m7-7H5"
                    stroke="#4F8EF7"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Contact List / Nearby List */}
        <div className="flex-1 overflow-y-auto py-4 min-h-0">
          {showNearby ? (
            <Nearby />
          ) : (
            <>
              {uniqueContacts.map((u) => (
                <SidebarContact
                  key={u.id}
                  user={u}
                  active={selectedUser?.id === u.id}
                  onClick={() => setSelectedUser(u)}
                  lastMsg={
                    messages
                      .filter(
                        (m) =>
                          (m.senderId === u.id && m.receiverId === user.id) ||
                          (m.senderId === user.id && m.receiverId === u.id)
                      )
                      .slice(-1)[0]?.text
                  }
                />
              ))}
              <PendingRequests
                requests={pendingRequests}
                contacts={uniqueContacts}
                onAccept={async (id) => {
                  await fetch("/api/contacts/accept", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    body: JSON.stringify({ senderId: id }),
                  });
                  fetch("/api/contacts", {
                    headers: {
                      Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                  })
                    .then((res) => res.json())
                    .then((data) =>
                      setContacts(Array.isArray(data) ? data : [])
                    );
                  setPendingRequests((prev) => prev.filter((u) => u.id !== id));
                }}
              />
            </>
          )}
        </div>
      </aside>

      {/* Main Chat Pane */}
      <main
        className={`absolute top-0 left-0 w-full h-full md:static flex-1 flex flex-col bg-white transition-transform duration-300 ease-in-out ${
          selectedUser ? "translate-x-0" : "translate-x-full md:translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="flex items-center px-4 md:px-8 py-5 border-b gap-3">
          {/* Back Button */}
          <button
            className="p-2 rounded-full hover:bg-gray-100 md:hidden"
            title="Back to contacts"
            onClick={() => setSelectedUser(null)}
          >
            <svg
              width={20}
              height={20}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>

          {/* Left Side: Selected User Info */}
          <div className="flex items-center gap-3 flex-1">
            {selectedUser ? (
              <>
                <ContactAvatar
                  username={selectedUser.username}
                  id={selectedUser.id}
                  avatarUrl={selectedUser.avatar_url}
                />
                <span className="font-semibold text-lg text-gray-800">
                  {selectedUser.username}
                </span>
              </>
            ) : (
              <div className="h-11"></div> // Placeholder to prevent layout shift
            )}
          </div>

          {/* Right Side: Profile & Settings Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              className="rounded-full ring-2 ring-blue-300 hover:ring-blue-500 transition-all overflow-hidden w-11 h-11 flex items-center justify-center bg-blue-100"
              title="My Account"
              onClick={() => setShowDropdown((prev) => !prev)}
            >
              {user.avatar_url ? (
                <img
                  src={
                    user.avatar_url?.startsWith("http")
                      ? user.avatar_url
                      : `${process.env.REACT_APP_API_BASE_URL || ""}${
                          user.avatar_url
                        }`
                  }
                  alt="My Profile"
                  className="w-11 h-11 rounded-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-blue-600">
                  {user.username ? user.username[0].toUpperCase() : "?"}
                </span>
              )}
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-20 border">
                <div className="py-1">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowProfile(true);
                      setShowDropdown(false);
                    }}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    My Profile
                  </a>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      // Replace handleSettings with setShowSettings(true) if that's the handler
                      setShowSettings(true);
                      setShowDropdown(false);
                    }}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Settings
                  </a>
                  <div className="border-t my-1"></div>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleLogout(); // Assuming you have a handleLogout function
                      setShowDropdown(false);
                    }}
                    className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Your Settings Modal and Profile Modal remain the same */}
        {showSettings && (
          <SettingsModal
            user={user}
            onClose={() => setShowSettings(false)}
            onUpdate={setUser}
          />
        )}
        {showProfile && (
          <ProfileModal
            user={user}
            onClose={() => setShowProfile(false)}
            onProfileUpdated={(updated) => {
              setUser(updated);
              setShowProfile(false);
            }}
          />
        )}

        {/* Messages */}
        <div
          className="flex-1 px-4 md:px-8 py-7 overflow-y-auto"
          ref={chatScrollRef}
        >
          {selectedUser ? (
            <div className="flex flex-col">
              {messages.map((msg, idx) =>
                msg ? (
                  <MessageBubble
                    key={msg.id || idx}
                    msg={msg}
                    isSender={msg.senderId === user.id}
                  />
                ) : null
              )}
            </div>
          ) : (
            <div className="hidden md:flex h-full items-center justify-center text-gray-400 text-center">
              Select a contact to start chatting
            </div>
          )}
        </div>
        {/* Message input */}
        {selectedUser && (
          <form
            className="flex items-center px-2 py-2 md:px-4 md:py-3 bg-white border-t gap-2 md:gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (text.trim()) handleSend();
            }}
          >
            {/* // This code goes inside your <form> element */}

            {/* Attachment Button & Menu */}
            <div className="relative" ref={attachmentMenuRef}>
              <button
                type="button"
                className="p-3 rounded-full text-gray-500 hover:bg-gray-100 transition"
                title="Attach"
                onClick={() => setShowAttachmentMenu((prev) => !prev)}
                disabled={isRecording}
              >
                {/* Paperclip Icon */}
                <svg
                  width={22}
                  height={22}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
              </button>

              {/* Attachment Pop-up Menu */}
              {showAttachmentMenu && (
                <div className="absolute bottom-full mb-2 w-56 bg-white rounded-lg shadow-xl border z-10 overflow-hidden">
                  {/* --- FIX IS HERE: Use <button> instead of <label> and trigger clicks programmatically --- */}

                  {/* Camera Option */}
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      cameraInputRef.current.click();
                      setShowAttachmentMenu(false);
                    }}
                  >
                    <svg
                      width={20}
                      height={20}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>Camera</span>
                  </button>

                  {/* Image/Gallery Option */}
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      imageInputRef.current.click();
                      setShowAttachmentMenu(false);
                    }}
                  >
                    <svg
                      width={20}
                      height={20}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>Photo & Video</span>
                  </button>

                  {/* Document Option */}
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      documentInputRef.current.click();
                      setShowAttachmentMenu(false);
                    }}
                  >
                    <svg
                      width={20}
                      height={20}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span>Document</span>
                  </button>
                </div>
              )}
            </div>

            {/* Hidden File Inputs */}
            <input
              id="camera-input"
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            <input
              id="image-input"
              ref={imageInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            <input
              id="document-input"
              ref={documentInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />

            {/* Text Input */}
            <input
              className="flex-1 px-4 py-2.5 text-base rounded-full border border-gray-200 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Type a message"
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoFocus
              disabled={isRecording}
            />

            {/* Conditional Send / Voice Record Button */}
            {text.trim() ? (
              <button
                type="submit"
                className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 text-white transition shadow-md"
                aria-label="Send"
              >
                <svg
                  width={24}
                  height={24}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                className={`w-12 h-12 flex items-center justify-center rounded-full transition shadow-md ${
                  isRecording
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-green-500 text-white hover:bg-green-600"
                }`}
                onClick={
                  isRecording ? handleStopRecording : handleStartRecording
                }
                title={isRecording ? "Stop Recording" : "Start Recording"}
              >
                {/* Mic / Stop Icons */}
                {isRecording ? (
                  <svg
                    width={20}
                    height={20}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M6 6h12v12H6z" />
                  </svg>
                ) : (
                  <svg
                    width={24}
                    height={24}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1.2-9.1c0-.66.54-1.2 1.2-1.2s1.2.54 1.2 1.2v6.2c0 .66-.54 1.2-1.2 1.2s-1.2-.54-1.2-1.2V4.9zM17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                )}
              </button>
            )}
          </form>
        )}
        {/* Modals */}
        {showAddContact && (
          <AddContactModal
            onClose={() => setShowAddContact(false)}
            onUserAdded={() => {
              setShowAddContact(false);
              fetch("/api/contacts", {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              })
                .then((res) => res.json())
                .then((data) => setContacts(Array.isArray(data) ? data : []));
            }}
          />
        )}
        {showProfile && (
          <ProfileModal
            user={user}
            onClose={() => setShowProfile(false)}
            onProfileUpdated={(updatedProfile) => {
              setShowProfile(false);
              setUser(updatedProfile);
              // Optionally, re-fetch contacts or other data here if needed
            }}
          />
        )}
        {previewFile && (
          <FilePreviewModal
            fileData={previewFile}
            onClose={() => setPreviewFile(null)}
            onSend={handleSendWithPreview}
          />
        )}
      </main>
    </div>
  );
}
