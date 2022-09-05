import "./styles.css";
import { Chat } from "./Chat";

const nodeTimer = document.querySelector("#timer") as HTMLElement;

const nodeNameSetupScreen = document.querySelector("#login") as HTMLDivElement;

const nodeLoginInput = document.querySelector("#user") as HTMLInputElement;

const nodeContactsList = document.querySelector(
  "#contacts_list"
) as HTMLUListElement;

const nodeMessageInput = document.querySelector(
  "#message_input"
) as HTMLInputElement;

const nodeMessagesList = document.querySelector(
  "#messages_list"
) as HTMLUListElement;

const nodeMessagesListContainer = document.querySelector(
  "#messages_list_container"
) as HTMLElement;

const nodeMessagesListContainerEdges =
  nodeMessagesListContainer?.querySelectorAll(
    "[data-edge]"
  ) as NodeListOf<HTMLElement>;

new Chat({
  nodeNameSetupScreen,
  nodeLoginInput,
  nodeTimer,
  nodeContactsList,
  nodeMessageInput,
  nodeMessagesListContainer,
  nodeMessagesListContainerEdges,
  nodeMessagesList,
});
