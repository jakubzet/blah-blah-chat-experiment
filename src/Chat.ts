import type {
  WEBSOCKET_MESSAGES,
  MSG_CHAT_MESSAGE_SENT,
  MSG_CHAT_MEMBER_NAME_SENT,
  ChatConstructorConfig,
  ChatMember,
  ChatMessage,
  localeTimeSenderParams,
} from "../common/types";

const ENDPOINT_WEBSOCKET_SERVER = `${import.meta.env.VITE_WS_URL}/api`;

const ENDPOINT_TIME_EVENT = `${
  import.meta.env.VITE_API_URL
}/api/get-current-time`;

// FIXME: Move to parameters in constructor
const EDGE_REACHED_CLASS_NAME = "is-blinking";

export class Chat {
  config: ChatConstructorConfig;
  socket: WebSocket;
  username: ChatMember["name"] = "";
  members: ChatMember[] = [];
  messages: ChatMessage[] = [];

  constructor(initConfig: ChatConstructorConfig) {
    this.config = initConfig;
    this.socket = new WebSocket(ENDPOINT_WEBSOCKET_SERVER);

    this.handleWebSocketsEvents();
    this.handleSSEEvents();
    this.handleDocumentEvents();
    this.handleNameSetupInputEvents();
    this.handleMessageInputEvents();

    this.setupMessagesListObserver();
    this.setupMessagesListContainerObserver();
    this.setupMessagesListEdgesObserver();
  }

  handleWebSocketsEvents(): void {
    this.socket.addEventListener("message", (event) => {
      const parsedSocketMsg: WEBSOCKET_MESSAGES = JSON.parse(event.data);

      if (parsedSocketMsg.type === "chat-member-id-assigned") {
        this.username = parsedSocketMsg.payload;
        this.hideNameSetupScreen();
      }

      if (parsedSocketMsg.type === "chat-members-list-updated") {
        this.members = parsedSocketMsg.payload;
        this.renderContacts();
      }

      if (parsedSocketMsg.type === "chat-messages-list-updated") {
        this.messages.push(parsedSocketMsg.payload.addedMessage);
        this.renderMessages();
      }
    });
  }

  handleSSEEvents(): void {
    const sseEventSource = new EventSource(ENDPOINT_TIME_EVENT);

    const onSseMessageCallback = (
      event: MessageEvent<localeTimeSenderParams>
    ) => {
      try {
        const { time } = JSON.parse((<unknown>event.data) as string);
        this.config.nodeTimer.textContent = time;
      } catch (err) {
        console.error("Error parsing SSE JSON response!", err);
      }
    };

    sseEventSource.onmessage = onSseMessageCallback;
  }

  handleDocumentEvents(): void {
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        this.scrollToLatestMessage();
      }
    });
  }

  handleNameSetupInputEvents(): void {
    this.config.nodeLoginInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        const target = ev.target as HTMLInputElement;

        this.username = target.value;

        const user: MSG_CHAT_MEMBER_NAME_SENT = {
          type: "chat-member-name-sent",
          payload: {
            name: this.username,
          },
        };

        this.socket.send(JSON.stringify(user));
      }
    });
  }

  handleMessageInputEvents(): void {
    this.config.nodeMessageInput.addEventListener("keydown", (event) => {
      const target = event.target as HTMLInputElement;

      if (event.key === "Enter") {
        event.preventDefault();

        const message: MSG_CHAT_MESSAGE_SENT = {
          type: "chat-message-sent",
          payload: {
            message: {
              authorId: this.username,
              time: new Date().toLocaleTimeString(),
              text: target.value.trim(),
            },
          },
        };

        this.socket.send(JSON.stringify(message));

        target.value = "";
      }
    });
  }

  setupMessagesListObserver(): void {
    const mutationObserverOptions = {
      attributes: false,
      childList: true,
      subtree: false,
    };

    const mutationObserverCallback = (mutations: MutationRecord[]) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          this.scrollToLatestMessage();
        }
      }
    };

    const mutationObserver = new MutationObserver(mutationObserverCallback);

    mutationObserver.observe(
      this.config.nodeMessagesList,
      mutationObserverOptions
    );
  }

  setupMessagesListContainerObserver(): void {
    const resizeObserverCallback = (resizesList: ResizeObserverEntry[]) => {
      resizesList.forEach(() => {
        this.scrollToLatestMessage();
      });
    };

    const resizeObserver = new ResizeObserver(resizeObserverCallback);

    resizeObserver.observe(this.config.nodeMessagesList, { box: "border-box" });
  }

  setupMessagesListEdgesObserver(): void {
    const intersectionObserverOptions = {
      threshold: 1,
    };

    const intersectionObserverCallback = (
      intersectionsList: IntersectionObserverEntry[]
    ) => {
      for (const intersection of intersectionsList) {
        if (intersection.isIntersecting) {
          intersection.target.classList.add(EDGE_REACHED_CLASS_NAME);
        } else {
          intersection.target.classList.remove(EDGE_REACHED_CLASS_NAME);
        }
      }
    };

    const intersectionObserver = new IntersectionObserver(
      intersectionObserverCallback,
      intersectionObserverOptions
    );

    this.config.nodeMessagesListContainerEdges.forEach((edge) => {
      intersectionObserver.observe(edge);
    });
  }

  renderContacts(): void {
    const parentNodeNewContent = document.createDocumentFragment();

    this.members.forEach(({ avatar, name, id, isConnected }) => {
      if (isConnected) {
        const nodeContact = document.createElement("li");

        nodeContact.classList.add(
          "contacts__entry-wrapper",
          "nodeContactsList",
          id === this.username ? "is-active" : "is-inactive"
        );

        nodeContact.innerHTML = `
          <img
            src="${avatar}"
            alt="${name}"
            class="contacts__entry-img avatar"
          />
  
          <span class="contacts__entry-name">${name}</span>
        `;

        parentNodeNewContent.appendChild(nodeContact);
      }
    });

    this.config.nodeContactsList.innerHTML = "";
    this.config.nodeContactsList.appendChild(parentNodeNewContent);
  }

  renderMessages(): void {
    const parentNodeNewContent = document.createDocumentFragment();

    const messagesToShow = this.messages.map((msg) => {
      const messageAuthor = this.members.find(
        (contact) => msg.authorId === contact.id
      );

      return {
        ...msg,
        authorName: messageAuthor?.name || "",
        authorAvatar: messageAuthor?.avatar || "",
      };
    });

    messagesToShow.forEach(
      ({ authorId, authorName, authorAvatar, time, text }) => {
        const nodeMessage = document.createElement("li");

        nodeMessage.classList.add(
          "message",
          authorId !== this.username ? "is-from-contact" : "is-from-me"
        );

        nodeMessage.innerHTML = `
        <div class="message__meta">
          <img
            src="${authorAvatar}"
            alt="${authorName}"
            class="message__avatar avatar"
          />
          <span>
            ${authorName} / ${time}
          </span>
        </div>
        <div class="message__text">${text}</div>
      `;

        parentNodeNewContent.appendChild(nodeMessage);
      }
    );

    this.config.nodeMessagesList.innerHTML = "";
    this.config.nodeMessagesList.appendChild(parentNodeNewContent);
  }

  scrollToLatestMessage(): void {
    this.config.nodeMessagesListContainer.scrollTop =
      this.config.nodeMessagesListContainer.scrollHeight;
  }

  hideNameSetupScreen(): void {
    this.config.nodeNameSetupScreen.style.display = "none";
  }
}
