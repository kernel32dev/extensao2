// esse arquivo é usado para compartilhar os tipos entre o front end e o back end

type ServerMessage = {
  event: "update-users";
  usernames: string[];
} | {
  event: "send-message";
  username: string;
  message: string;
};

type ClientMessage = {
    event: "send-message";
    message: string;
};
