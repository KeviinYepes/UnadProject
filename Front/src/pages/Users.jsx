import React, { useEffect, useMemo, useState } from "react";
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Toast from "../components/Toast";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import UserService from "../services/UserService";
import RoleService from "../services/RoleService";

const Users = () => {
  const PAGE_SIZE = 5;
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    documentType: "CC",
    documentNumber: "",
    roleId: "",
    status: true,
  });

  /* ================== CARGAR USUARIOS Y ROLES ================== */
  useEffect(() => {
    cargarRoles();
    cargarUsuarios();
  }, []);

  const paginatedUsuarios = useMemo(
    () => paginate(usuarios, currentPage, PAGE_SIZE),
    [usuarios, currentPage]
  );

  useEffect(() => {
    setCurrentPage((page) => clampPage(page, usuarios.length, PAGE_SIZE));
  }, [usuarios.length]);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const data = await UserService.getAll();
      setUsuarios(data || []);
      setError("");
    } catch (error) {
      console.error("Error cargando usuarios:", error);
      const errorMsg = error.response?.data?.message 
        || error.response?.data?.error 
        || error.message 
        || "Error al cargar usuarios";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const cargarRoles = async () => {
    try {
      const data = await RoleService.getAll();
      setRoles(data);
    } catch (error) {
      console.error("Error cargando roles:", error);
      // No mostrar error de roles como error crítico
      // Se mostrará "Seleccionar..." en el dropdown
      setError(""); // No bloquear si roles falla
    }
  };

  /* ================== MANEJO FORM ================== */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (editingUser) {
        // Actualizar usuario existente
        await UserService.update(editingUser.id, form);
        showToast("Usuario actualizado correctamente.");
      } else {
        // Crear nuevo usuario
        await UserService.create(form);
        showToast("Usuario creado correctamente.");
      }

      // Limpiar formulario y recargar
      resetForm();
      cargarUsuarios();
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      const apiMessage = error.response?.data?.error || error.response?.data?.message;
      const fallbackMessage = error.message || "Error al guardar usuario";
      const message = apiMessage || fallbackMessage;
      showToast("Error al guardar usuario: " + message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (usuario) => {
    setEditingUser(usuario);
    setForm({
      firstName: usuario.firstName || "",
      lastName: usuario.lastName || "",
      email: usuario.email || "",
      documentType: usuario.documentType || "CC",
      documentNumber: usuario.documentNumber || "",
      roleId: usuario.role?.id || "",
      status: usuario.status !== undefined && usuario.status !== null ? usuario.status : true,
    });
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDelete?.id) return;

    try {
      setLoading(true);
      await UserService.delete(userToDelete.id);
      showToast("Usuario eliminado correctamente.");
      setUserToDelete(null);
      cargarUsuarios();
    } catch (error) {
      console.error(error);
      showToast("Error al eliminar usuario: " + (error.response?.data?.message || error.message), "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      documentType: "CC",
      documentNumber: "",
      roleId: "",
      status: true,
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  return (
    <div className="flex h-screen w-full font-display bg-background-light text-text-light-primary dark:bg-background-dark dark:text-text-dark-primary">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Header />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-12">

            {/* ================= HEADER ================= */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-extrabold text-text-primary-light dark:text-text-primary-dark">
                  Gestión de Usuarios
                </h1>
                <p className="text-text-secondary-light dark:text-text-secondary-dark mt-2">
                  Administra los usuarios registrados en la plataforma.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenCreate}
                disabled={loading}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-white shadow-md transition hover:bg-primary/90 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Agregar usuario
              </button>
            </div>

            {/* Mensaje de error global */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* ================= TABLA (PRIMERO) ================= */}
            <div className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border-light dark:border-border-dark">
                <h2 className="font-bold text-lg text-text-primary-light dark:text-text-primary-dark">
                  Lista de Usuarios
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-light dark:bg-surface-dark text-xs uppercase font-bold tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                    <tr>
                      <th className="px-6 py-3">Nombre Completo</th>
                      <th className="px-6 py-3">Correo</th>
                      <th className="px-6 py-3">Documento</th>
                      <th className="px-6 py-3">Rol</th>
                      <th className="px-6 py-3">Estado</th>
                      <th className="px-6 py-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && usuarios.length === 0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="px-6 py-8 text-center text-text-secondary-light dark:text-text-secondary-dark"
                        >
                          Cargando usuarios...
                        </td>
                      </tr>
                    ) : usuarios.length === 0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="px-6 py-8 text-center text-text-secondary-light dark:text-text-secondary-dark"
                        >
                          No hay usuarios registrados aún.
                        </td>
                      </tr>
                    ) : (
                      paginatedUsuarios.map((u) => {
                        let roleName = 'Sin rol';

                        if (u.role && typeof u.role === 'object' && u.role.roleName) {
                          roleName = u.role.roleName;
                        } else if (typeof u.role === 'number' && u.role !== 0) {
                          roleName = roles.find(r => r.id === u.role)?.roleName || 'Sin rol';
                        } else if (u.roleId && typeof u.roleId === 'number') {
                          roleName = roles.find(r => r.id === u.roleId)?.roleName || 'Sin rol';
                        }

                        return (
                          <tr
                            key={u.id}
                            className="border-b border-border-light dark:border-border-dark hover:bg-background-light dark:hover:bg-background-dark transition"
                          >
                            <td className="px-6 py-4 font-semibold">
                              {String(u.firstName || '')} {String(u.lastName || '')}
                            </td>
                            <td className="px-6 py-4">{String(u.email || '')}</td>
                            <td className="px-6 py-4">{String(u.documentNumber || 'N/A')}</td>
                            <td className="px-6 py-4">{String(roleName)}</td>
                            <td className="px-6 py-4">
                              <EstadoBadge estado={u.status ? "Activo" : "Inactivo"} />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => handleEdit(u)}
                                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-semibold"
                                  disabled={loading}
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => setUserToDelete(u)}
                                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-semibold"
                                  disabled={loading}
                                >
                                  Eliminar
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={currentPage}
                totalItems={usuarios.length}
                pageSize={PAGE_SIZE}
                onPageChange={(page) => setCurrentPage(clampPage(page, usuarios.length, PAGE_SIZE))}
              />
            </div>

            {/* ================= MODAL FORMULARIO ================= */}
            {isModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <button
                  type="button"
                  className="absolute inset-0 bg-black/50"
                  onClick={handleCloseModal}
                  aria-label="Cerrar modal"
                />

                <div className="relative w-full max-w-3xl rounded-xl bg-card-light p-6 shadow-lg dark:bg-card-dark border border-border-light dark:border-border-dark">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                        {editingUser ? "Editar Usuario" : "Crear Nuevo Usuario"}
                      </h2>
                      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
                        Completa los datos del usuario.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-background-light text-text-light-secondary transition-colors hover:bg-primary/10 hover:text-primary dark:bg-background-dark dark:text-dark-secondary dark:hover:bg-primary/20 dark:hover:text-primary"
                      aria-label="Cerrar"
                      disabled={loading}
                    >
                      <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
                    <Input
                      label="Nombre"
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      disabled={loading}
                    />

                    <Input
                      label="Apellido"
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      disabled={loading}
                    />

                    <Input
                      label="Correo Electrónico"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      disabled={loading}
                    />

                    <Select
                      label="Tipo de Documento"
                      name="documentType"
                      value={form.documentType}
                      onChange={handleChange}
                      options={[
                        { value: "CC", label: "Cédula de Ciudadanía" },
                        { value: "TI", label: "Tarjeta de Identidad" },
                        { value: "CE", label: "Cédula de Extranjería" },
                        { value: "PA", label: "Pasaporte" }
                      ]}
                      disabled={loading}
                    />

                    <Input
                      label="Número de Documento"
                      name="documentNumber"
                      value={form.documentNumber}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="Se usa como método de autenticación"
                    />

                    <Select
                      label="Rol"
                      name="roleId"
                      value={form.roleId}
                      onChange={handleChange}
                      options={roles.map(r => ({ value: r.id, label: r.roleName || r.name }))}
                      disabled={loading}
                    />

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        name="status"
                        checked={!!form.status}
                        onChange={handleChange}
                        disabled={loading}
                        className="w-4 h-4 text-primary focus:ring-primary"
                      />
                      <label className="text-sm font-semibold">Usuario Activo</label>
                    </div>

                    <div className="md:col-span-2 flex justify-end gap-4 mt-4">
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="px-6 py-2 rounded-lg bg-surface-light dark:bg-surface-dark font-semibold"
                        disabled={loading}
                      >
                        Cancelar
                      </button>

                      <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-2 rounded-lg bg-primary text-white font-bold shadow-md hover:bg-primary/90 transition disabled:opacity-50"
                      >
                        {loading ? "Guardando..." : editingUser ? "Actualizar Usuario" : "Crear Usuario"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      <ConfirmDialog
        open={Boolean(userToDelete)}
        title="Eliminar usuario"
        message={`Estas seguro de eliminar el usuario "${getUserFullName(userToDelete)}"? Esta accion no se puede deshacer.`}
        loading={loading}
        onCancel={() => setUserToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

/* ================= COMPONENTES AUXILIARES ================= */

const Input = ({ label, type = "text", required = true, disabled = false, ...props }) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-semibold">{label}</label>
    <input
      type={type}
      {...props}
      className="input"
      required={required}
      disabled={disabled}
    />
  </div>
);

const Select = ({ label, options, disabled = false, ...props }) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-semibold">{label}</label>
    <select {...props} className="input" required disabled={disabled}>
      <option value="">Seleccionar...</option>
      {options.map((op) => (
        <option key={op.value || op} value={op.value || op}>
          {op.label || op}
        </option>
      ))}
    </select>
  </div>
);

const EstadoBadge = ({ estado }) => (
  <span
    className={`px-3 py-1 text-xs font-bold rounded-full ${
      estado === "Activo"
        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
        : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
    }`}
  >
    {estado}
  </span>
);

const getUserFullName = (user) => {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
  return fullName || user?.email || "seleccionado";
};

const paginate = (items, page, pageSize) => {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
};

const clampPage = (page, totalItems, pageSize) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  return Math.min(Math.max(1, page), totalPages);
};

export default Users;

