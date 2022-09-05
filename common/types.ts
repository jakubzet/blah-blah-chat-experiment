export type localeTimeSenderParams = {
  time: string;
};

export type ChatConstructorConfig = {
  nodeNameSetupScreen: HTMLDivElement;
  nodeLoginInput: HTMLInputElement;
  nodeTimer: HTMLElement;
  nodeContactsList: HTMLUListElement;
  nodeMessageInput: HTMLInputElement;
  nodeMessagesListContainer: HTMLElement;
  nodeMessagesListContainerEdges: NodeListOf<HTMLElement>;
  nodeMessagesList: HTMLUListElement;
};

export type ChatMember = {
  id: string;
  name: string;
  avatar: string;
  isConnected: boolean;
};

export type ChatMessage = {
  time: string;
  text: string;
  authorId: ChatMember["id"];
  authorName?: ChatMember["name"];
  authorAvatar?: ChatMember["avatar"];
};

export type MSG_CHAT_MESSAGE_SENT = {
  type: "chat-message-sent";
  payload: {
    message: ChatMessage;
  };
};

export type MSG_CHAT_MESSAGES_LIST_UPDATED = {
  type: "chat-messages-list-updated";
  payload: {
    addedMessage: ChatMessage;
  };
};

export type MSG_CHAT_MEMBER_NAME_SENT = {
  type: "chat-member-name-sent";
  payload: {
    name: ChatMember["name"];
  };
};

export type MSG_CHAT_MEMBER_ID_ASSIGNED = {
  type: "chat-member-id-assigned";
  payload: ChatMember["id"];
};

export type MSG_CHAT_MEMBERS_LIST_UPDATED = {
  type: "chat-members-list-updated";
  payload: ChatMember[];
};

export type WEBSOCKET_MESSAGES =
  | MSG_CHAT_MESSAGE_SENT
  | MSG_CHAT_MESSAGES_LIST_UPDATED
  | MSG_CHAT_MEMBER_NAME_SENT
  | MSG_CHAT_MEMBER_ID_ASSIGNED
  | MSG_CHAT_MEMBERS_LIST_UPDATED;
