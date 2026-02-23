const socket = io();

let username = "";


let currentRoom = "";
let allMessages = [];
let mySocketId = null;
let currentUsers = [];

// DOM


const roomNameInput = document.getElementById("roomName");
const roomPasswordInput = document.getElementById("roomPassword");
const joinBtn = document.getElementById("joinBtn");
const roomInfo = document.getElementById("roomInfo");
const errorText = document.getElementById("errorText");
const usersList = document.getElementById("usersList");

const chatBox = document.getElementById("chatBox");
const typingBox = document.getElementById("typingBox");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const roomTitle = document.getElementById("roomTitle");
const searchInput = document.getElementById("searchInput");
const usernameDisplay = document.getElementById("usernameDisplay");
const avatarCircle = document.getElementById("avatarCircle");
const fileInput = document.getElementById("fileInput");
const sendFileBtn = document.getElementById("sendFileBtn");
const mentionBadge = document.getElementById("mentionBadge");

// init user
usernameDisplay.textContent = username;
avatarCircle.textContent = username.charAt(0).toUpperCase();

function isMentioningMe(text) {
  const tag = "@" + username.toLowerCase();
  return text.toLowerCase().includes(tag);
}

// join room
function joinRoom() {
  const room = roomNameInput.value.trim();
  const password = roomPasswordInput.value.trim();
  const usernameInput = document.getElementById("usernameInput");
  const enteredUsername = usernameInput.value.trim();

  if (!room || !password || !enteredUsername) {
    errorText.textContent = "Please enter username, room & password";
    return;
  }

  username = enteredUsername; // set global username

  // update sidebar
  usernameDisplay.textContent = username;
  avatarCircle.textContent = username.charAt(0).toUpperCase();

  socket.emit("join-room", {
    room,
    password,
    username,
  });
}


// send text
function sendMessage() {
  if (!currentRoom) return;
  const text = messageInput.value.trim();
  if (!text) return;

  socket.emit("message", { room: currentRoom, text });
  messageInput.value = "";
}

// users render
function renderUsers(users) {
  currentUsers = users || [];
  usersList.innerHTML = "";

  const me = currentUsers.find((u) => u.id === mySocketId);
  const myRole = me ? me.role : "user";

  currentUsers.forEach((u) => {
    const li = document.createElement("li");
    li.className = "user-item";

    const left = document.createElement("div");
    left.className = "user-left";

    const dot = document.createElement("span");
    dot.className = "user-dot " + (u.status === "online" ? "online" : "offline");

    const name = document.createElement("span");
    name.textContent = u.username;

    left.appendChild(dot);
    left.appendChild(name);

    const right = document.createElement("div");

    const roleSpan = document.createElement("span");
    roleSpan.className = "user-role " + (u.role === "admin" ? "admin" : "");
    roleSpan.textContent = u.role;
    right.appendChild(roleSpan);

    // kick button if I am admin and not myself
    if (myRole === "admin" && u.id !== mySocketId) {
      const kickBtn = document.createElement("span");
      kickBtn.style.marginLeft = "6px";
      kickBtn.style.cursor = "pointer";
      kickBtn.style.fontSize = "11px";
      kickBtn.style.color = "#f97373";
      kickBtn.textContent = "Kick";
      kickBtn.onclick = () => {
        if (confirm(`Kick ${u.username}?`)) {
          socket.emit("kick-user", { room: currentRoom, targetId: u.id });
        }
      };
      right.appendChild(kickBtn);
    }

    li.appendChild(left);
    li.appendChild(right);
    usersList.appendChild(li);
  });
}

// message DOM
function createMessageElement(msg) {
  const row = document.createElement("div");
  row.classList.add("message-row");
  if (msg.system) row.classList.add("system");
  if (!msg.system && msg.username === username) row.classList.add("self");
  row.dataset.id = msg.id;

  const meta = document.createElement("div");
  meta.className = "message-meta";

  const nameSpan = document.createElement("span");
  nameSpan.className = "meta-username";
  nameSpan.textContent = msg.system ? "System" : msg.username;

  if (!msg.system && msg.text && isMentioningMe(msg.text)) {
    nameSpan.classList.add("mention-me");
  }

  const timeSpan = document.createElement("span");
  timeSpan.textContent = msg.time || "";

  meta.appendChild(nameSpan);
  if (msg.edited) {
    const editedSpan = document.createElement("span");
    editedSpan.textContent = "• edited";
    meta.appendChild(editedSpan);
  }
  meta.appendChild(timeSpan);

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";

  if (msg.deleted) {
    bubble.textContent = msg.text;
  } else if (msg.fileUrl) {
    const label = document.createElement("div");
    label.textContent = msg.fileName || "File";
    bubble.appendChild(label);

    if (msg.fileType && msg.fileType.startsWith("image/")) {
      const img = document.createElement("img");
      img.src = msg.fileUrl;
      img.className = "file-preview";
      bubble.appendChild(img);
    } else {
      const link = document.createElement("a");
      link.href = msg.fileUrl;
      link.target = "_blank";
      link.textContent = "Open file";
      link.style.color = "#60a5fa";
      bubble.appendChild(link);
    }
  } else {
    bubble.textContent = msg.text;
  }

  row.appendChild(meta);
  row.appendChild(bubble);

  if (!msg.system && msg.username === username && !msg.deleted && !msg.fileUrl) {
    const actions = document.createElement("div");
    actions.className = "message-actions";

    const editBtn = document.createElement("span");
    editBtn.textContent = "Edit";
    editBtn.onclick = () => {
      const newText = prompt("Edit message:", msg.text);
      if (newText && newText.trim()) {
        socket.emit("edit-message", {
          room: currentRoom,
          messageId: msg.id,
          newText: newText.trim(),
        });
      }
    };

    const deleteBtn = document.createElement("span");
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = () => {
      if (confirm("Delete this message?")) {
        socket.emit("delete-message", {
          room: currentRoom,
          messageId: msg.id,
        });
      }
    };

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    row.appendChild(actions);
  }

  if (!msg.system) {
    const reactions = document.createElement("div");
    reactions.className = "reactions";
    const emojis = ["👍", "🔥", "😂"];

    emojis.forEach((emoji) => {
      const span = document.createElement("span");
      span.style.cursor = "pointer";
      span.style.marginRight = "4px";
      span.textContent = emoji;
      span.onclick = () => {
        socket.emit("react-message", {
          room: currentRoom,
          messageId: msg.id,
          emoji,
        });
      };
      reactions.appendChild(span);
    });

    const counts = document.createElement("span");
    counts.style.marginLeft = "4px";
    counts.textContent = formatReactionCounts(msg.reactions || {});
    reactions.appendChild(counts);

    row.appendChild(reactions);
  }

  return row;
}

function formatReactionCounts(reactions) {
  const parts = [];
  for (const emoji in reactions) {
    if (reactions[emoji] > 0) {
      parts.push(`${emoji} ${reactions[emoji]}`);
    }
  }
  return parts.join("  ");
}

function renderMessages(messages) {
  chatBox.innerHTML = "";
  messages.forEach((m) => {
    const el = createMessageElement(m);
    chatBox.appendChild(el);
  });
  chatBox.scrollTop = chatBox.scrollHeight;
}

function updateSingleMessage(msg) {
  const idx = allMessages.findIndex((m) => m.id === msg.id);
  if (idx !== -1) {
    allMessages[idx] = msg;
  } else {
    allMessages.push(msg);
  }

  const node = chatBox.querySelector(`[data-id="${msg.id}"]`);
  const newEl = createMessageElement(msg);

  if (!node) {
    chatBox.appendChild(newEl);
  } else {
    chatBox.replaceChild(newEl, node);
  }
  chatBox.scrollTop = chatBox.scrollHeight;
}

// search
function applySearch() {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) {
    renderMessages(allMessages);
    return;
  }
  const filtered = allMessages.filter(
    (m) =>
      (m.username && m.username.toLowerCase().includes(q)) ||
      (m.text && m.text.toLowerCase().includes(q))
  );
  renderMessages(filtered);
}

// upload file
async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  // simple fetch POST to /upload
  const res = await fetch("/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data; // {url, fileName, fileType}
}

// socket events
socket.on("join-success", ({ room, users, messages, yourId }) => {
  currentRoom = room;
  mySocketId = yourId;
  roomTitle.textContent = `Room: ${room}`;
  roomInfo.textContent = `Connected to ${room}`;
  errorText.textContent = "";
  mentionBadge.style.display = "none";

  allMessages = messages || [];
  renderMessages(allMessages);
  renderUsers(users || []);
});

socket.on("join-failed", (msg) => {
  errorText.textContent = msg;
});

socket.on("room-users", (users) => {
  renderUsers(users || []);
});

socket.on("message", (msg) => {
  allMessages.push(msg);
  renderMessages(allMessages);

  if (!msg.system && msg.text && isMentioningMe(msg.text)) {
    mentionBadge.style.display = "flex";
  }
});

socket.on("message-updated", (msg) => {
  updateSingleMessage(msg);
});

socket.on("typing", (user) => {
  if (!currentRoom) return;
  typingBox.textContent = `${user} is typing...`;
  setTimeout(() => {
    typingBox.textContent = "";
  }, 1000);
});

socket.on("kicked", ({ room }) => {
  if (currentRoom === room) {
    alert("You were kicked from this room.");
    currentRoom = "";
    roomInfo.textContent = "Not in any room";
    roomTitle.textContent = "Welcome 👋";
    chatBox.innerHTML = "";
    usersList.innerHTML = "";
  }
});

// UI events
joinBtn.addEventListener("click", joinRoom);
sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
});

messageInput.addEventListener("input", () => {
  if (currentRoom && messageInput.value.trim()) {
    socket.emit("typing");
  }
});

searchInput.addEventListener("input", applySearch);

sendFileBtn.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file || !currentRoom) return;

  try {
    const { url, fileName, fileType } = await uploadFile(file);
    socket.emit("file-message", {
      room: currentRoom,
      fileUrl: url,
      fileName,
      fileType,
    });
  } catch (err) {
    console.error(err);
    alert("File upload failed");
  } finally {
    fileInput.value = "";
  }
});

mentionBadge.addEventListener("click", () => {
  mentionBadge.style.display = "none";
  chatBox.scrollTop = chatBox.scrollHeight;
});
