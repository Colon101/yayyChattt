const colorArray = ["#FF8300", "#7AFF00", "#FF007B"];

// Function to get a random color from the array
function getRandomColor() {
  return colorArray[Math.floor(Math.random() * colorArray.length)];
}
const socket = io();
const messageInput = document.getElementById("messageInput");
const chatContainer = document.getElementById("chatContainer");
const sendButton = document.getElementById("sendButton");

messageInput.addEventListener("input", function () {
  const lines = this.value.split("\n").length;
  const lineHeight = 20;

  this.style.height = `${lineHeight * lines}px`;
});

messageInput.style.height = "20px";
function sendMessage() {
  const message = messageInput.value.trim();

  if (message !== "") {
    socket.emit("message_sent", { message_text: message });
    const messageContainer = document.createElement("div");

    messageInput.value = "";
    messageInput.style.height = "20px";
  }
}
socket.on("message_received", function (data) {
  const message = data.message_text;
  appendMessage(message);
});

async function GetMessages(offset) {
  try {
    offset = offset | 0;
    let data = await fetch("/get_messages?offset=" + offset);
    const messages = await data.json();
    return messages.messages;
  } catch (error) {
    console.error("Error fetching messages:", error);
    return []; // Return an empty array in case of an error
  }
}
sendButton.addEventListener("click", sendMessage);

messageInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});
async function someFunction(offset) {
  let messages = await GetMessages(offset);

  const reversedMessages = [...messages].reverse();

  for (let i = 0; i < reversedMessages.length; i++) {
    let message = reversedMessages[i][1];
    appendMessage(message);
  }
}
someFunction();
function constructMessage(message) {
  try {
    if (message !== "") {
      const messageContainer = document.createElement("div");
      messageContainer.classList.add("message");

      const messageLabel = document.createElement("p");
      messageLabel.classList.add("message-label");
      messageLabel.style.color = getRandomColor();

      const messageContent = document.createElement("p");
      const messageLines = message.split("\n");

      // Process each line separately
      for (let i = 0; i < messageLines.length; i++) {
        const line = messageLines[i];
        const lineElement = document.createElement("span");

        // Regular expression to match URLs in the line
        const urlRegex = /(https?:\/\/\S+|\S+\.\S+)/g; // Updated regex

        let lastIndex = 0;

        // Find and replace URLs with anchor tags
        let match;
        while ((match = urlRegex.exec(line)) !== null) {
          const [url] = match;
          const textBefore = line.substring(lastIndex, match.index);
          lastIndex = match.index + url.length;

          // Add text before the URL
          lineElement.appendChild(document.createTextNode(textBefore));

          // Add the link element
          const linkElement = document.createElement("a");
          linkElement.href = url.startsWith("http") ? url : "http://" + url; // Add 'http://' if not present
          linkElement.textContent = url;
          linkElement.target = "_blank";
          linkElement.classList.add("messagelink");
          lineElement.appendChild(linkElement);
        }

        // Add any remaining text after the last URL
        lineElement.appendChild(
          document.createTextNode(line.substring(lastIndex))
        );

        // Add <br> except for the last line
        if (i < messageLines.length - 1) {
          messageContent.appendChild(lineElement);
          messageContent.appendChild(document.createElement("br"));
        } else {
          messageContent.appendChild(lineElement);
        }
      }

      messageContent.classList.add("message-content");

      messageContainer.appendChild(messageLabel);
      messageContainer.appendChild(messageContent);

      return messageContainer;
    }
  } catch (error) {
    console.log(error);
    return null;
  }
}

function appendMessage(message) {
  const messageContainer = constructMessage(message);
  if (messageContainer) {
    chatContainer.appendChild(messageContainer);
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
  }
}

function prependMessage(message) {
  const messageContainer = constructMessage(message);
  if (messageContainer) {
    if (chatContainer.prepend) {
      chatContainer.prepend(messageContainer);
    } else {
      chatContainer.insertBefore(messageContainer, chatContainer.firstChild);
    }
  }
}
var headerHeight = document.querySelector("header").offsetHeight;

document.querySelector(".chat-container").style.marginTop = headerHeight + "px";
offset = 1;
let savedScrollPos = 0;

document
  .querySelector(".chat-container")
  .addEventListener("scroll", async function () {
    var chatContainer = this;

    if (chatContainer.scrollTop === 0) {
      try {
        savedScrollPos = chatContainer.scrollHeight - chatContainer.scrollTop;

        let msgs = await GetMessages(offset);

        for (i = 0; i < msgs.length; i++) {
          prependMessage(msgs[i][1]);
        }

        offset++;

        chatContainer.scrollTop = chatContainer.scrollHeight - savedScrollPos;
      } catch (error) {
        prependMessage(error);
      }
    }
  });
