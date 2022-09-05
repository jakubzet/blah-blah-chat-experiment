import type { WebSocketServer } from "ws";
import type {
  WEBSOCKET_MESSAGES,
  MSG_CHAT_MEMBER_ID_ASSIGNED,
  MSG_CHAT_MEMBERS_LIST_UPDATED,
  MSG_CHAT_MESSAGES_LIST_UPDATED,
  ChatMember,
} from "../common/types";

// NOTE: Extending WebSocket interface of ws to add custom properties
declare module "ws" {
  class _WS extends WebSocket {}
  interface WebSocket extends _WS {
    memberId?: ChatMember["id"];
  }
}

// NOTE: Function to simplify WebSocket messages typing
function stringifySocketMessage<T extends WEBSOCKET_MESSAGES>(msg: T): string {
  return JSON.stringify(msg as T);
}

export function setupAndHandleChatWebSocketServer(
  webSocketServer: WebSocketServer
) {
  // NOTE: In-memory members map - definitely not production ready :)
  const members = new Map<ChatMember["id"], ChatMember>();

  const notifyAllClientsAboutUpdatedMembersList = () => {
    webSocketServer.clients.forEach((client) => {
      client.send(
        stringifySocketMessage<MSG_CHAT_MEMBERS_LIST_UPDATED>({
          type: "chat-members-list-updated",
          payload: Array.from(members.values()),
        })
      );
    });
  };

  webSocketServer.on("connection", (ws) => {
    ws.on("message", (rawData) => {
      const msgData: WEBSOCKET_MESSAGES = JSON.parse(rawData + "");

      if (msgData.type === "chat-member-name-sent") {
        const memberId = members.size.toString();

        members.set(memberId, {
          name: msgData.payload.name,
          id: memberId,
          avatar: `https://picsum.photos/id/${+memberId + 10}/50`,
          isConnected: true,
        });

        ws.memberId = memberId;

        ws.send(
          stringifySocketMessage<MSG_CHAT_MEMBER_ID_ASSIGNED>({
            type: "chat-member-id-assigned",
            payload: memberId,
          })
        );

        notifyAllClientsAboutUpdatedMembersList();
      }

      if (msgData.type === "chat-message-sent") {
        webSocketServer.clients.forEach((client) => {
          client.send(
            stringifySocketMessage<MSG_CHAT_MESSAGES_LIST_UPDATED>({
              type: "chat-messages-list-updated",
              payload: {
                addedMessage: msgData.payload.message,
              },
            })
          );
        });
      }
    });

    ws.on("close", () => {
      const disconnectedMemberId = ws.memberId;

      if (disconnectedMemberId != null) {
        let disconnectedMemberData = members.get(disconnectedMemberId);

        if (disconnectedMemberData) {
          disconnectedMemberData.isConnected = false;
          members.set(disconnectedMemberId, disconnectedMemberData);
          notifyAllClientsAboutUpdatedMembersList();
        }
      }
    });
  });
}
