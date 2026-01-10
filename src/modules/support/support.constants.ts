export const SupportConstants = {
    UPLOAD_PATH: 'uploads/support',
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    ALLOWED_IMAGE_MIMES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as string[],
    ALLOWED_VIDEO_MIMES: ['video/mp4', 'video/quicktime', 'video/x-msvideo'] as string[],
    SOCKET_EVENTS: {
        ADMIN_SUPPORT_MESSAGE: 'admin_support_message',
        USER_SUPPORT_MESSAGE: 'user_support_message',
        NEW_SUPPORT_INBOX: 'new_support_inbox',
        MESSAGE_READ: 'support_message_read',
    },
    SOCKET_ROOMS: {
        ADMIN: 'room_admin',
        USER_PREFIX: 'room_user_',
    },
} as const;
