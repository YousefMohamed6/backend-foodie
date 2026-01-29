export const ChatConstants = {
  UPLOAD_PATH: 'uploads/chat',
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_IMAGE_MIMES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ] as string[],
  ALLOWED_VIDEO_MIMES: [
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
  ] as string[],
  MESSAGE_TYPES: {
    TEXT: 'TEXT',
    IMAGE: 'IMAGE',
    VIDEO: 'VIDEO',
  },
  CHAT_TYPES: {
    CUSTOMER_VENDOR: 'CUSTOMER_VENDOR',
    CUSTOMER_DRIVER: 'CUSTOMER_DRIVER',
    DRIVER_VENDOR: 'DRIVER_VENDOR',
    ADMIN: 'ADMIN',
  },
  SOCKET_EVENTS: {
    MESSAGE: 'message',
    NEW_MESSAGE: 'new_message',
    MARKED_AS_SEEN: 'markedAsSeen',
    TYPING: 'typing',
    STOP_TYPING: 'stop_typing',
  },
  SOCKET_ROOMS: {
    CHANNEL_PREFIX: 'channel_',
    USER_PREFIX: 'user_',
  },
} as const;

export type ChatMessageType = 'TEXT' | 'IMAGE' | 'VIDEO';
export type ChatType = 'CUSTOMER_VENDOR' | 'CUSTOMER_DRIVER' | 'DRIVER_VENDOR' | 'ADMIN';
