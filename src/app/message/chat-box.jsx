import React, { useEffect, useState, useRef, useCallback } from "react";
import { useChannel } from "ably/react";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { SendIcon } from "lucide-react";
import { useUser } from "../context/UserContext";
import {
  createGroup,
  getAllGroups,
  addMessageToGroup,
  getGroupMessages,
} from "@/lib/actions/group.actions";
import { getUserByEmail } from "@/lib/actions/user.actions";
import { useSession } from "next-auth/react";

function ChatBox() {
  const [groups, setGroups] = useState([]);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [receivedMessages, setMessages] = useState([]);
  const [user_, setUser_] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const channelName = "proteinbind-chat";
  const { data: session } = useSession();
  const user = useUser();

  const bottomRef = useRef(null);
  const chatContainerRef = useRef(null);
  const currentGroupRef = useRef(null);

  // keep ref in sync so ably callback always sees the latest group
  useEffect(() => {
    currentGroupRef.current = currentGroup;
  }, [currentGroup]);

  // ── ably real-time channel ───────────────────────────────
  const { channel } = useChannel(channelName, (message) => {
    const incoming = message.data;

    if (
      currentGroupRef.current &&
      incoming.groupId === currentGroupRef.current._id
    ) {
      setMessages((prevMessages) => {
        const exists = prevMessages.some((m) => m._id === incoming._id);
        if (exists) return prevMessages;
        return [...prevMessages, incoming];
      });
    }
  });

  // ── auto-scroll to latest message ────────────────────────
  const prevMsgCountRef = useRef(0);
  const justSentRef = useRef(false);

  const scrollToBottom = (behavior = "smooth") => {
    const doScroll = () => {
      const container = chatContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    };
    // scroll multiple times to catch late DOM renders
    doScroll();
    requestAnimationFrame(doScroll);
    setTimeout(doScroll, 50);
    setTimeout(doScroll, 150);
  };

  useEffect(() => {
    if (receivedMessages.length === 0) return;

    const wasFreshLoad = prevMsgCountRef.current === 0;
    prevMsgCountRef.current = receivedMessages.length;

    // always jump to bottom on fresh load (group switch)
    if (wasFreshLoad) {
      scrollToBottom("instant");
      return;
    }

    // always scroll when WE just sent a message
    if (justSentRef.current) {
      justSentRef.current = false;
      scrollToBottom("smooth");
      return;
    }

    // for incoming messages from others, only scroll if near bottom
    const container = chatContainerRef.current;
    if (container) {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      if (distanceFromBottom < 150) {
        scrollToBottom("smooth");
      }
    }
  }, [receivedMessages]);

  // ── fetch user + groups on mount ─────────────────────────
  useEffect(() => {
    const fetchGroups = async () => {
      if (!session?.user?.email) return;
      try {
        const fetchedUser = await getUserByEmail(session.user.email);
        setUser_(fetchedUser);
        const groupsFromServer = await getAllGroups();
        setGroups(groupsFromServer || []);
      } catch (err) {
        console.error("failed to load groups:", err);
      }
    };
    fetchGroups();
  }, [session?.user?.email]);

  // ── load messages (with pagination support) ──────────────
  const loadMessages = useCallback(async (groupId, page = 1, append = false) => {
    if (page === 1) setIsLoadingMessages(true);
    else setIsLoadingMore(true);

    try {
      const result = await getGroupMessages(groupId, page, 50);
      if (!result) return;

      const formatted = result.messages.map((msg) => ({
        _id: msg._id,
        groupId: msg.groupId,
        senderId:
          typeof msg.senderId === "object" ? msg.senderId._id : msg.senderId,
        name: msg.senderId?.firstName
          ? `${msg.senderId.firstName} ${msg.senderId.lastName}`
          : "unknown user",
        image: msg.senderId?.photo || "/default-avatar.png",
        data: msg.messageText,
        timestamp: msg.createdAt,
      }));

      if (append) {
        setMessages((prev) => [...formatted, ...prev]);
      } else {
        setMessages(formatted);
      }

      setCurrentPage(result.page);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error("failed to load messages:", err);
    } finally {
      setIsLoadingMessages(false);
      setIsLoadingMore(false);
    }
  }, []);

  // ── create group ─────────────────────────────────────────
  const handleCreateGroup = async (groupName) => {
    if (groupName && user_ && !groups.some((group) => group.name === groupName)) {
      try {
        const newGroup = await createGroup(groupName, user_._id);
        setGroups([...groups, newGroup]);
        setCurrentGroup(newGroup);
        setMessages([]);
        prevMsgCountRef.current = 0;
      } catch (err) {
        console.error("failed to create group:", err);
      }
    }
  };

  // ── join / select group ──────────────────────────────────
  const handleJoinGroup = async (groupId) => {
    if (!groupId) return;
    const selectedGroup = groups.find((group) => group._id === groupId);
    if (!selectedGroup) return;

    setCurrentGroup(selectedGroup);
    setMessages([]);
    prevMsgCountRef.current = 0;
    setCurrentPage(1);
    setTotalPages(1);
    await loadMessages(groupId, 1);
  };

  // ── load older messages ──────────────────────────────────
  const loadOlderMessages = async () => {
    if (!currentGroup || currentPage >= totalPages || isLoadingMore) return;
    const prevScrollHeight = chatContainerRef.current?.scrollHeight || 0;
    await loadMessages(currentGroup._id, currentPage + 1, true);
    requestAnimationFrame(() => {
      if (chatContainerRef.current) {
        const newScrollHeight = chatContainerRef.current.scrollHeight;
        chatContainerRef.current.scrollTop = newScrollHeight - prevScrollHeight;
      }
    });
  };

  // ── send message — database-first ────────────────────────
  const sendChatMessage = async (text) => {
    try {
      if (!currentGroup || !channel || !user_ || isSending) return;
      setIsSending(true);

      // 1. immediately show the message in chat (optimistic UI)
      const tempId = `temp-${Date.now()}`;
      const optimisticMsg = {
        _id: tempId,
        groupId: currentGroup._id,
        senderId: user_._id,
        name: `${user.firstName} ${user.lastName}`,
        image: user.photo || "/default-avatar.png",
        data: text,
        timestamp: new Date().toISOString(),
      };

      justSentRef.current = true; // tell scroll effect to always scroll
      setMessages((prev) => [...prev, optimisticMsg]);
      setMessageText("");

      // 2. persist to database in background
      const savedMsg = await addMessageToGroup(
        currentGroup._id,
        user_._id,
        text,
      );

      if (!savedMsg) throw new Error("message save failed");

      // 3. replace temp entry with the real DB entry (swap _id)
      setMessages((prev) =>
        prev.map((m) =>
          m._id === tempId
            ? { ...optimisticMsg, _id: savedMsg._id, timestamp: savedMsg.createdAt }
            : m,
        ),
      );

      // 4. broadcast to other users with the real _id
      await channel.publish("chat-message", {
        ...optimisticMsg,
        _id: savedMsg._id,
        timestamp: savedMsg.createdAt,
      });
    } catch (error) {
      console.log(error);
    } finally {
      setIsSending(false);
    }
  };

  const handleFormSubmission = (event) => {
    event.preventDefault();
    if (messageText.trim()) {
      sendChatMessage(messageText);
    }
  };

  // ── ownership check using persistent senderId ────────────
  const isOwnMessage = (message) => {
    return user_ && message.senderId === user_._id;
  };

  // ── date formatting helpers ──────────────────────────────
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "today";
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "yesterday";
    return d.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  };

  // group messages by date for separators
  const groupedByDate = receivedMessages.reduce((acc, msg) => {
    const dateKey = new Date(msg.timestamp).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(msg);
    return acc;
  }, {});

  const renderedMessages = Object.entries(groupedByDate).map(
    ([dateKey, dateMessages]) => (
      <div key={dateKey}>
        {/* date separator */}
        <div className="my-3 flex items-center gap-3">
          <div className="h-px flex-1 bg-stroke dark:bg-strokedark" />
          <span className="text-gray-400 text-[11px] font-medium uppercase">
            {formatDate(dateKey)}
          </span>
          <div className="h-px flex-1 bg-stroke dark:bg-strokedark" />
        </div>

        {dateMessages.map((message, index) => {
          const isMe = isOwnMessage(message);
          return (
            <div
              key={message._id || index}
              className={`flex  ${isMe ? "justify-end" : "justify-start"} mb-4`}
            >
              <div
                className={`max-w-xs rounded-lg border p-4 dark:border-graydark ${
                  isMe
                    ? "bg-primary text-white shadow-md"
                    : "bg-gray-200 dark:bg-gray-700 shadow-sm"
                }`}
              >
                <div className="mb-2 flex items-center">
                  <img
                    src={message.image || "/default-avatar.png"}
                    alt={message.name}
                    className="mr-2 h-8 w-8 rounded-full"
                  />
                  <span className="text-sm ">
                    {isMe ? "you" : message.name}
                  </span>
                </div>
                <p className="text-xs">{message.data}</p>
                <span className="text-gray-400 text-xs">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    ),
  );

  return (
    <DefaultLayout>
      <div className="container mx-auto h-screen p-4">
        <h1 className="mb-6 text-3xl text-black dark:text-white">
          drug discovery chat
        </h1>

        <div className="mb-6 flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
          <input
            type="text"
            placeholder="create new group"
            className="w-full rounded-lg border border-stroke bg-white p-4 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            onKeyPress={(e) => {
              if (e.key === "Enter") handleCreateGroup(e.target.value);
            }}
          /> 
          <div className="relative w-full">
            <select
              onChange={(e) => handleJoinGroup(e.target.value)}
              className="w-full rounded-lg border border-stroke bg-white p-4 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            >
              <option value="">join a group</option>
              {groups.map((group) => (
                <option key={group._id} value={group._id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {currentGroup && (
          <div className="rounded-lg border border-stroke p-6 dark:border-form-strokedark dark:bg-form-input">
            <h2 className="mb-4 text-xl text-black dark:text-white">
              current group: {currentGroup.name}
            </h2>
            <div
              ref={chatContainerRef}
              className="dark:bg-gray-900 mb-4 h-64 overflow-y-auto rounded-lg bg-white p-4  dark:bg-[#181818]"
            >
              {/* load older messages button */}
              {currentPage < totalPages && (
                <div className="mb-3 flex justify-center">
                  <button
                    onClick={loadOlderMessages}
                    disabled={isLoadingMore}
                    className="rounded-full border border-stroke px-4 py-1 text-xs text-bodydark transition-colors hover:border-primary hover:text-primary dark:border-strokedark"
                  >
                    {isLoadingMore ? "loading..." : "↑ load older messages"}
                  </button>
                </div>
              )}

              {isLoadingMessages ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-gray-500 animate-pulse">
                    loading messages...
                  </p>
                </div>
              ) : receivedMessages.length > 0 ? (
                <>
                  {renderedMessages}
                  <div ref={bottomRef}></div>
                </>
              ) : (
                <p className="text-gray-500">
                  no messages yet. start chatting!
                </p>
              )}
            </div>
            <form onSubmit={handleFormSubmission} className="flex space-x-4">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="type a message..."
                className="w-full rounded-lg border border-stroke bg-white p-4 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
              />
              <button
                type="submit"
                disabled={!messageText.trim() || isSending}
                className="disabled:bg-gray-400 flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed"
              >
                <SendIcon className="mr-2" />
                {isSending ? "sending..." : "send"}
              </button>
            </form>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
}

export default ChatBox;