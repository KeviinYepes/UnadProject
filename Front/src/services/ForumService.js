import api from "../config/api";

const ForumService = {
  getConversations: async () => {
    const response = await api.get("/api/forum/conversations");
    return Array.isArray(response.data?.data) ? response.data.data : [];
  },

  getQuestionsByContent: async (contentId) => {
    const response = await api.get(`/api/forum/content/${contentId}/questions`);
    return Array.isArray(response.data?.data) ? response.data.data : [];
  },

  getNotifications: async (userId) => {
    const response = await api.get(`/api/forum/notifications/${userId}`);
    return response.data?.data || { contentQuestionCount: 0, answerCount: 0, total: 0 };
  },

  markNotificationsSeen: async (userId) => {
    return api.put(`/api/forum/notifications/${userId}/seen`);
  },

  createQuestion: async ({ contentId, userId, title, description }) => {
    const response = await api.post("/api/forum/questions", {
      contentId,
      userId,
      title,
      description,
    });

    const created = response.data?.data || response.data;
    window.dispatchEvent(new CustomEvent("forum-notifications-changed"));
    return created;
  },
};

export default ForumService;
