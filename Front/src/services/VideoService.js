import api from '../config/api';

const VideoService = {
  /**
   * Lista todos los videos
   * @returns {Promise<Array>}
   */
  getAll: async () => {
    const response = await api.get('/api/videos');
    return response.data.data || response.data;
  },

  /**
   * Obtiene un video por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  getById: async (id) => {
    const response = await api.get(`/api/videos/${id}`);
    return response.data;
  },

  /**
   * Crea un nuevo video (requiere rol ADMIN)
   * @param {Object} videoData
   * @returns {Promise<Object>}
   */
  create: async (videoData) => {
    const response = await api.post('/api/videos', videoData);
    return response.data.data || response.data;
  },

  /**
   * Actualiza un video existente (requiere rol ADMIN)
   * @param {number} id
   * @param {Object} videoData
   * @returns {Promise<Object>}
   */
  update: async (id, videoData) => {
    const response = await api.put(`/api/videos/${id}`, videoData);
    return response.data.data || response.data;
  },

  /**
   * Elimina un video (requiere rol ADMIN)
   * @param {number} id
   * @returns {Promise<void>}
   */
  delete: async (id) => {
    const response = await api.delete(`/api/videos/${id}`);
    return response.data;
  },

  /**
   * Sube un archivo (imagen o PDF) como contenido
   * @param {File} file
   * @param {Object} metadata - { title, description, category, type }
   */
  upload: async (file, metadata = {}) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", metadata.title || "");
    formData.append("description", metadata.description || "");
    formData.append("category", metadata.category || "");
    formData.append("type", metadata.type || "VIDEO");
    if (metadata.thumbnail) {
      formData.append("thumbnail", metadata.thumbnail);
    }
    const response = await api.post("/api/videos/upload", formData);
    return response.data.data || response.data;
  }
};

export default VideoService;
