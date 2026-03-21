let io: any;
const userSockets = new Map<string, string>(); // userId -> socketId

export const initSocket = (ioInstance: any) => {
  io = ioInstance;
};

export const registerUserSocket = (userId: string, socketId: string) => {
  userSockets.set(userId, socketId);
};

export const removeUserSocket = (socketId: string) => {
  for (const [userId, id] of userSockets.entries()) {
    if (id === socketId) {
      userSockets.delete(userId);
      break;
    }
  }
};

export const sendRealTimeNotification = (recipientId: string, data: any) => {
  if (!io) return;
  const socketId = userSockets.get(recipientId.toString());
  if (socketId) {
    io.to(socketId).emit('notification', data);
  }
};

export const sendRealTimeMessage = (recipientId: string, message: any) => {
  if (!io) return;
  const socketId = userSockets.get(recipientId.toString());
  if (socketId) {
    io.to(socketId).emit('new_message', message);
  }
};
export const notifyMessageDeleted = (recipientId: string, chatId: string, messageId: string) => {
  if (!io) return;
  const socketId = userSockets.get(recipientId.toString());
  if (socketId) {
    io.to(socketId).emit('message_deleted', { chatId, messageId });
  }
};
