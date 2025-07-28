import { useState, useEffect, useRef, useMemo } from "react";
import { socketService } from "../services/socket.js"; // Also add extension for your services

// Add the .jsx extension to all your component imports
import ContactAvatar from "./ContactAvatar.jsx";
import SidebarContact from "./SideBarContact.jsx";
import PendingRequests from "./PendingRequests.jsx";
import AddContactModal from "./AddContactModal.jsx";
import MessageBubble from "./MessageBubble.jsx";
import ProfileModal from "./Profile.jsx";
import Nearby from "./nearby.tsx"; // Assuming this is a TypeScript file, you can import it directly
import SettingsModal from "./Setting.jsx";
import FilePreviewModal from "./FilePreviewModal.jsx";
import "./css/chat.css"; // Ensure this path is correct

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
    <div className="chat-layout">
      {/* Sidebar */}
      <aside className={`chat-sidebar ${selectedUser ? 'sidebar-hidden' : 'sidebar-visible'}`}>
        <div className="sidebar-header">
          <span className="sidebar-title">
            {showNearby ? "Nearby Users" : "Contacts"}
          </span>
          <div className="sidebar-actions">
            <button
              title={showNearby ? "Show Contacts" : "Show Nearby Users"}
              className="action-button"
              onClick={() => setShowNearby((v) => !v)}
            >
              {showNearby ? (
                <svg className="action-icon" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                  <path d="M8 15h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg className="action-icon" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                </svg>
              )}
            </button>
            {!showNearby && (
              <button
                onClick={() => setShowAddContact(true)}
                className="action-button"
                title="Add Contact"
              >
                <svg className="action-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14m7-7H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="contacts-container">
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
      <main className={`chat-main ${selectedUser ? 'main-visible' : 'main-hidden'}`}>
        {/* Header */}
        <div className="chat-header">
          <button
            className="back-button"
            title="Back to contacts"
            onClick={() => setSelectedUser(null)}
          >
            <svg className="back-icon" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
          </button>

          <div className="chat-user-info">
            {selectedUser ? (
              <>
                <ContactAvatar
                  username={selectedUser.username}
                  id={selectedUser.id}
                  avatarUrl={selectedUser.avatar_url}
                />
                <div className="user-details">
                  <span className="username">{selectedUser.username}</span>
                  <span className="status">Online</span>
                </div>
              </>
            ) : (
              <div className="placeholder-header"></div>
            )}
          </div>

          <div className="profile-menu" ref={dropdownRef}>
            <button
              className="profile-button"
              title="My Account"
              onClick={() => setShowDropdown((prev) => !prev)}
            >
              {user.avatar_url ? (
                <img
                  src={
                    user.avatar_url?.startsWith("http")
                      ? user.avatar_url
                      : `${process.env.REACT_APP_API_BASE_URL || ""}${user.avatar_url}`
                  }
                  alt="My Profile"
                  className="profile-avatar"
                />
              ) : (
                <span className="profile-initials">
                  {user.username ? user.username[0].toUpperCase() : "?"}
                </span>
              )}
            </button>

            {showDropdown && (
              <div className="dropdown-menu">
                <div className="dropdown-content">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setShowProfile(true);
                      setShowDropdown(false);
                    }}
                    className="dropdown-item"
                  >
                    <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                    My Profile
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setShowSettings(true);
                      setShowDropdown(false);
                    }}
                    className="dropdown-item"
                  >
                    <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    Settings
                  </button>
                  <div className="dropdown-divider"></div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleLogout();
                      setShowDropdown(false);
                    }}
                    className="dropdown-item logout"
                  >
                    <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="messages-container" ref={chatScrollRef}>
          {selectedUser ? (
            <div className="messages-list">
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
            <div className="empty-chat">
              <div className="empty-icon">💬</div>
              <h3>Welcome to Loopin</h3>
              <p>Select a contact to start chatting</p>
            </div>
          )}
        </div>

        {/* Message Input */}
        {selectedUser && (
          <form
            className="message-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (text.trim()) handleSend();
            }}
          >
            {/* Attachment Menu */}
            <div className="attachment-wrapper" ref={attachmentMenuRef}>
              <button
                type="button"
                className="attachment-button"
                title="Attach"
                onClick={() => setShowAttachmentMenu((prev) => !prev)}
                disabled={isRecording}
              >
                <svg className="attachment-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                </svg>
              </button>

              {showAttachmentMenu && (
                <div className="attachment-menu">
                  <button
                    type="button"
                    className="attachment-option"
                    onClick={() => {
                      cameraInputRef.current.click();
                      setShowAttachmentMenu(false);
                    }}
                  >
                    <div className="option-icon camera">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                    </div>
                    <span>Camera</span>
                  </button>

                  <button
                    type="button"
                    className="attachment-option"
                    onClick={() => {
                      imageInputRef.current.click();
                      setShowAttachmentMenu(false);
                    }}
                  >
                    <div className="option-icon gallery">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                    </div>
                    <span>Photo & Video</span>
                  </button>

                  <button
                    type="button"
                    className="attachment-option"
                    onClick={() => {
                      documentInputRef.current.click();
                      setShowAttachmentMenu(false);
                    }}
                  >
                    <div className="option-icon document">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                    </div>
                    <span>Document</span>
                  </button>
                </div>
              )}
            </div>

            {/* Hidden File Inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            <input
              ref={documentInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />

            {/* Text Input */}
            <div className="input-wrapper">
              <input
                className="message-input"
                placeholder="Type a message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                autoFocus
                disabled={isRecording}
              />
              {isRecording && <div className="recording-indicator">Recording...</div>}
            </div>

            {/* Send/Voice Button */}
            {text.trim() ? (
              <button type="submit" className="send-button" aria-label="Send">
                <svg className="send-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                </svg>
              </button>
            ) : (
              <button
                type="button"
                className={`voice-button ${isRecording ? 'recording' : ''}`}
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                title={isRecording ? "Stop Recording" : "Start Recording"}
              >
                {isRecording ? (
                  <svg className="stop-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 6h12v12H6z"/>
                  </svg>
                ) : (
                  <svg className="mic-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1.2-9.1c0-.66.54-1.2 1.2-1.2s1.2.54 1.2 1.2v6.2c0 .66-.54 1.2-1.2 1.2s-1.2-.54-1.2-1.2V4.9zM17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                  </svg>
                )}
              </button>
            )}
          </form>
        )}

        {/* Modals */}
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