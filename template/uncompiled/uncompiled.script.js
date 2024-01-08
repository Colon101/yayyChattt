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
    if (data.ok) {
      const messages = await data.json();
      return messages.messages;
    } else if (data.status === 404) {
      console.log("got 404");
      return "EOF";
    }
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
    const secondChild = chatContainer.children[1];

    if (secondChild) {
      chatContainer.insertBefore(messageContainer, secondChild);
    } else {
      // If there is no second child, simply append the messageContainer
      chatContainer.appendChild(messageContainer);
    }
  }
}

var headerHeight = document.querySelector("header").offsetHeight;

document.querySelector(".chat-container").style.marginTop = headerHeight + "px";
offset = 1;
let savedScrollPos = 0;
let isLoading = false;
let EOF = false;
document
  .querySelector(".chat-container")
  .addEventListener("scroll", async function () {
    var chatContainer = this;

    if (chatContainer.scrollTop === 0 && !isLoading) {
      if (!EOF) {
        try {
          // Set the loading flag to true
          isLoading = true;

          // Add a loading spinner (replace with your own loading UI)
          showLoadingSpinner();

          // Save the current scroll position
          savedScrollPos = chatContainer.scrollHeight - chatContainer.scrollTop;

          // Fetch messages
          let msgs = await GetMessages(offset);
          if (!(msgs == "EOF")) {
            // Prepend messages to the chat
            for (let i = 0; i < msgs.length; i++) {
              prependMessage(msgs[i][1]);
            }

            // Increment the offset
            offset++;

            // Set the scroll position to maintain the previous view
            chatContainer.scrollTop =
              chatContainer.scrollHeight - savedScrollPos;
          } else {
            EOF = true;
          }
        } catch (error) {
          prependMessage(String(error));
        } finally {
          // Reset the loading flag and hide the loading spinner
          isLoading = false;
          hideLoadingSpinner();
        }
      }
    }
  });
function consturctLoadingSpinner(src) {}
function showLoadingSpinner() {
  savedScrollPos = chatContainer.scrollHeight - chatContainer.scrollTop;
  document.getElementById("spinner").style.display = "block";
  chatContainer.scrollTop = chatContainer.scrollHeight - savedScrollPos;
}
function hideLoadingSpinner() {
  savedScrollPos = chatContainer.scrollHeight - chatContainer.scrollTop;
  document.getElementById("spinner").style.display = "none";
  chatContainer.scrollTop = chatContainer.scrollHeight - savedScrollPos;
}
