import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Toast from "../components/Toast";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import RoleService from "../services/RoleService";

const Roles = () => {
  const PAGE_SIZE = 5;
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState({
    roleName: "",
    description: "",
  });

  useEffect(() => {
    cargarRoles();
  }, []);

  const paginatedRoles = useMemo(
    () => paginate(roles, currentPage, PAGE_SIZE),
    [roles, currentPage]
  );

  useEffect(() => {
    setCurrentPage((page) => clampPage(page, roles.length, PAGE_SIZE));
  }, [roles.length]);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const cargarRoles = async () => {
    try {
      setLoading(true);
      const data = await RoleService.getAll();
      setRoles(data || []);
      setError("");
    } catch (error) {
      console.error("Error cargando roles:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Error al cargar roles";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
    });
  };

  const resetForm = () => {
    setEditingRole(null);
    setForm({
      roleName: "",
      description: "",
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setForm({
      roleName: role.roleName || "",
      description: role.description || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (editingRole) {
        await RoleService.update(editingRole.id, form);
        showToast("Rol actualizado correctamente.");
      } else {
        await RoleService.create(form);
        showToast("Rol creado correctamente.");
      }

      resetForm();
      await cargarRoles();
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      const apiMessage = error.response?.data?.error || error.response?.data?.message;
      const fallbackMessage = error.message || "Error al guardar rol";
      const message = apiMessage || fallbackMessage;
      setError(message);
      showToast("Error al guardar rol: " + message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!roleToDelete?.id) return;

    try {
      setLoading(true);
      await RoleService.delete(roleToDelete.id);
      showToast("Rol eliminado correctamente.");
      setRoleToDelete(null);
      await cargarRoles();
    } catch (error) {
      console.error(error);
      showToast("Error al eliminar rol: " + (error.response?.data?.message || error.message), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full font-display bg-background-light text-text-light-primary dark:bg-background-dark dark:text-text-dark-primary">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Header />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-extrabold text-text-primary-light dark:text-text-primary-dark">
                  Gestión de Roles
                </h1>
                <p className="text-text-secondary-light dark:text-text-secondary-dark mt-2">
                  Administra los roles de la plataforma.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenCreate}
                disabled={loading}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-white shadow-md transition hover:bg-primary/90 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Agregar rol
              </button>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border-light dark:border-border-dark">
                <h2 className="font-bold text-lg text-text-primary-light dark:text-text-primary-dark">
                  Lista de Roles
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-light dark:bg-surface-dark text-xs uppercase font-bold tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                    <tr>
                      <th className="px-6 py-3">Rol</th>
                      <th className="px-6 py-3">Descripción</th>
                      <th className="px-6 py-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && roles.length === 0 ? (
                      <tr>
                        <td
                          colSpan="3"
                          className="px-6 py-8 text-center text-text-secondary-light dark:text-text-secondary-dark"
                        >
                          Cargando roles...
                        </td>
                      </tr>
                    ) : roles.length === 0 ? (
                      <tr>
                        <td
                          colSpan="3"
                          className="px-6 py-8 text-center text-text-secondary-light dark:text-text-secondary-dark"
                        >
                          No hay roles registrados aún.
                        </td>
                      </tr>
                    ) : (
                      paginatedRoles.map((r) => (
                        <tr
                          key={r.id}
                          className="border-b border-border-light dark:border-border-dark hover:bg-background-light dark:hover:bg-background-dark transition"
                        >
                          <td className="px-6 py-4 font-semibold">{String(r.roleName || "")}</td>
                          <td className="px-6 py-4">{String(r.description || "")}</td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleEdit(r)}
                                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-semibold"
                                disabled={loading}
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => setRoleToDelete(r)}
                                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-semibold"
                                disabled={loading}
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={currentPage}
                totalItems={roles.length}
                pageSize={PAGE_SIZE}
                onPageChange={(page) => setCurrentPage(clampPage(page, roles.length, PAGE_SIZE))}
              />
            </div>

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
                        {editingRole ? "Editar Rol" : "Crear Nuevo Rol"}
                      </h2>
                      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
                        Completa los datos del rol.
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
                      label="Nombre del Rol"
                      name="roleName"
                      value={form.roleName}
                      onChange={handleChange}
                      disabled={loading}
                    />

                    <div className="md:col-span-2">
                      <Textarea
                        label="Descripción"
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        disabled={loading}
                        required={false}
                      />
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
                        {loading ? "Guardando..." : editingRole ? "Actualizar Rol" : "Crear Rol"}
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
        open={Boolean(roleToDelete)}
        title="Eliminar rol"
        message={`Estas seguro de eliminar el rol "${roleToDelete?.roleName || ""}"? Esta accion no se puede deshacer.`}
        loading={loading}
        onCancel={() => setRoleToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

const Input = ({ label, type = "text", required = true, disabled = false, ...props }) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-semibold">{label}</label>
    <input type={type} {...props} className="input" required={required} disabled={disabled} />
  </div>
);

const Textarea = ({ label, required = true, disabled = false, rows = 4, ...props }) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-semibold">{label}</label>
    <textarea {...props} rows={rows} className="input" required={required} disabled={disabled} />
  </div>
);

const paginate = (items, page, pageSize) => {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
};

const clampPage = (page, totalItems, pageSize) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  return Math.min(Math.max(1, page), totalPages);
};

export default Roles;

