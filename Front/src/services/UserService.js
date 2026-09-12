import api from "../config/api";

const UserService = {
  /**
   * Lista todos los usuarios
   * @returns {Promise<Array>}
   */
  getAll: async () => {
    const response = await api.get("/api/users");
    // La API retorna { code, status, message, data: [...] }
    const usuarios = Array.isArray(response.data?.data)
      ? response.data.data
      : [];
    return usuarios;
  },

  /**
   * Obtiene un usuario por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  getById: async (id) => {
    const response = await api.get(`/api/users/${id}`);
    return response.data.data || response.data;
  },

  /**
   * Busca un usuario por email
   * @param {string} email
   * @returns {Promise<Object>}
   */
  searchByEmail: async (email) => {
    const response = await api.get(`/api/users/search/email?email=${email}`);
    return response.data;
  },

  /**
   * Busca un usuario por número de documento
   * @param {string} documentNumber
   * @returns {Promise<Object>}
   */
  searchByDocument: async (documentNumber) => {
    const response = await api.get(
      `/api/users/search/document?documentNumber=${documentNumber}`
    );
    return response.data;
  },

  /**
   * Lista usuarios por rol
   * @param {number} roleId
   * @returns {Promise<Array>}
   */
  getByRole: async (roleId) => {
    const response = await api.get(`/api/users/role/${roleId}`);
    return response.data;
  },

  /**
   * Verifica si existe un email
   * @param {string} email
   * @returns {Promise<boolean>}
   */
  existsByEmail: async (email) => {
    const response = await api.get(`/api/users/exists/email?email=${email}`);
    return response.data;
  },

  /**
   * Verifica si existe un documento
   * @param {string} documentNumber
   * @returns {Promise<boolean>}
   */
  existsByDocument: async (documentNumber) => {
    const response = await api.get(
      `/api/users/exists/document?documentNumber=${documentNumber}`
    );
    return response.data;
  },

  /**
   * Crea un nuevo usuario (requiere rol ADMIN)
   * @param {Object} userData
   * @returns {Promise<Object>}
   */
  create: async (userData) => {
    const status = typeof userData?.status === "boolean" ? userData.status : true;
    const payload = {
      firstName: userData?.firstName,
      lastName: userData?.lastName,
      email: userData?.email,
      documentType: userData?.documentType,
      documentNumber: userData?.documentNumber,
      role: userData?.roleId ? { id: Number(userData.roleId) } : null,
      status,
    };

    const response = await api.post("/api/users", payload);
    return response.data.data || response.data;
  },

  /**
   * Actualiza un usuario existente (requiere rol ADMIN)
   * @param {number} id
   * @param {Object} userData
   * @returns {Promise<Object>}
   */
  update: async (id, userData) => {
    const status = typeof userData?.status === "boolean" ? userData.status : true;
    const payload = {
      firstName: userData?.firstName,
      lastName: userData?.lastName,
      email: userData?.email,
      documentType: userData?.documentType,
      documentNumber: userData?.documentNumber,
      role: userData?.roleId ? { id: Number(userData.roleId) } : null,
      status,
    };

    const response = await api.put(`/api/users/${id}`, payload);
    return response.data.data || response.data;
  },

  /**
   * Elimina un usuario (requiere rol ADMIN)
   * @param {number} id
   * @returns {Promise<void>}
   */
  delete: async (id) => {
    const response = await api.delete(`/api/users/${id}`);
    return response.data.data || response.data;
  },

  /**
   * Obtiene el perfil del usuario autenticado
   */
  getMe: async () => {
    const response = await api.get("/api/users/me");
    return response.data.data || response.data;
  },

  /**
   * Actualiza los datos del perfil del usuario autenticado
   */
  updateMe: async (data) => {
    const response = await api.put("/api/users/me", data);
    return response.data.data || response.data;
  },

  /**
   * Sube una nueva foto de perfil
   */
  uploadPhoto: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/api/users/me/photo", formData);
    return response.data.data || response.data;
  },
};

export default UserService;
