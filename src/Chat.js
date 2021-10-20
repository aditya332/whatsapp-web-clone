import React, { useState, useEffect } from "react";
import "./Chat.css";
import { Avatar, IconButton } from "@material-ui/core";
import { SearchOutlined } from "@material-ui/icons";
import AttachFileIcon from "@material-ui/icons/AttachFile";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import InsertEmoticonIcon from "@material-ui/icons/InsertEmoticon";
import MicIcon from "@material-ui/icons/Mic";
import { useParams } from "react-router-dom";
import db from "./firebase";
import { useStateValue } from "./StateProvider";
import firebase from "firebase";

import SHA256 from "crypto-js/sha256";

function Chat() {
  const [input, setInput] = useState("");
  const { chatId } = useParams();
  const [chatName, setChatName] = useState("");
  const [messageId, setmessageId] = useState("");
  const [messages, setMessages] = useState([]);
  const [{ user }, dispatch] = useStateValue();

  useEffect(() => {
    if (chatId) {
      db.collection("Users")
        .doc(user.email)
        .collection("chats")
        .doc(chatId)
        .onSnapshot((snapshot) => {
          setChatName(snapshot.data().recieverName);
          setmessageId(snapshot.data().messageId);

          db.collection("message_section")
            .doc(snapshot.data().messageId)
            .collection("messages")
            .orderBy("added", "asc")
            .onSnapshot((snapshot) =>
              setMessages(snapshot.docs.map((doc) => doc.data()))
            );
        });
    }
  }, [chatId]);

  const sendMessage = async (e) => {
    e.preventDefault();

    var hashText = SHA256(input);

    const code = {
      code: hashText.toString() + "-" + user.email,
    };

    fetch(
      "https://us-east-1.aws.webhooks.mongodb-realm.com/api/client/v2.0/app/application-0-hddeb/service/manthanAPI/incoming_webhook/putEncrytedMsgCode",
      {
        method: "POST",
        body: JSON.stringify(code),
        headers: {
          "Content-type": "application/json; charset=UTF-8",
        },
      }
    )
      .then((response) => response.json())
      .then((json) => {
        console.log(json);
      });

    db.collection("message_section").doc(messageId).collection("messages").add({
      message: input,
      name: user.displayName,
      added: firebase.firestore.FieldValue.serverTimestamp(),
      userId: user.email,
    });
    setInput("");
  };

  return (
    <div className="chat">
      <div className="chat_header">
        <Avatar src={`https://avatars.dicebear.com/api/human/${chatId}.svg`} />
        <div className="chat_headerInfo">
          <h3>{chatName}</h3>
          {messages[messages.length - 1] && (
            <p>
              Last seen at{" "}
              {new Date(
                messages[messages.length - 1]?.added?.toDate()
              ).toUTCString()}
            </p>
          )}
        </div>
        <div className="chat_headerRight">
          <IconButton>
            <SearchOutlined />
          </IconButton>
          <IconButton>
            <AttachFileIcon />
          </IconButton>
          <IconButton>
            <MoreVertIcon />
          </IconButton>
        </div>
      </div>

      <div className="chat_body">
        {messages.map((message) => (
          <p
            className={`chat_message ${
              message.userId === user.email && "chat_sender"
            }`}
          >
            <span className="chat_name">
              {message.userId !== user.email ? chatName : "You"}
            </span>
            {message.message}
            <span className="chat_timestamp">
              {new Date(message.added?.toDate()).toUTCString()}
            </span>
          </p>
        ))}
      </div>

      <div className="chat_footer">
        <InsertEmoticonIcon />
        <form>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message"
            type="text"
          />
          <button onClick={sendMessage} type="submit">
            Send a message
          </button>
        </form>
        <MicIcon />
      </div>
    </div>
  );
}

export default Chat;
