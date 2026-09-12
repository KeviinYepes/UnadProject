import { buildApiUrl } from "../config/api";

export const ACCEPTED_MATERIAL_TYPES =
  ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/png,image/webp";

const MATERIAL_FORMATS = [
  {
    label: "PDF",
    displayName: "Documento PDF",
    extensions: ["pdf"],
    mimeTypes: ["application/pdf"],
    icon: "picture_as_pdf",
    tone: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300",
  },
  {
    label: "DOC",
    displayName: "Documento Word",
    extensions: ["doc", "docx"],
    mimeTypes: ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    icon: "description",
    tone: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
  },
  {
    label: "XLS",
    displayName: "Hoja de calculo Excel",
    extensions: ["xls", "xlsx"],
    mimeTypes: ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    icon: "table_chart",
    tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300",
  },
  {
    label: "JPG",
    displayName: "Imagen JPG",
    extensions: ["jpg", "jpeg"],
    mimeTypes: ["image/jpeg"],
    icon: "image",
    tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300",
  },
  {
    label: "PNG",
    displayName: "Imagen PNG",
    extensions: ["png"],
    mimeTypes: ["image/png"],
    icon: "image",
    tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300",
  },
  {
    label: "WEBP",
    displayName: "Imagen WEBP",
    extensions: ["webp"],
    mimeTypes: ["image/webp"],
    icon: "image",
    tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300",
  },
];

const fallbackFormat = {
  label: "ARCHIVO",
  displayName: "Archivo de apoyo",
  icon: "draft",
  tone: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

export const getMaterialFormat = (material) => {
  const mimeType = String(material?.mimeType || material?.type || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  const extension = getFileExtension(material?.fileName || material?.name || material?.driveFileId);

  return (
    MATERIAL_FORMATS.find((format) => format.mimeTypes.includes(mimeType)) ||
    MATERIAL_FORMATS.find((format) => format.extensions.includes(extension)) ||
    fallbackFormat
  );
};

export const getMaterialFormatsSummary = (materials = []) => {
  const labels = Array.from(new Set(materials.map((material) => getMaterialFormat(material).label)));
  if (labels.length === 0) return "";
  if (labels.length <= 2) return labels.join(" + ");
  return `${labels.slice(0, 2).join(" + ")} +${labels.length - 2}`;
};

export const getPrimaryMaterialFormat = (materials = []) =>
  materials.length > 0 ? getMaterialFormat(materials[0]) : fallbackFormat;

export const isImageMaterial = (material) => getMaterialFormat(material).icon === "image";

export const getMaterialUrl = (material) => {
  if (material?.driveFileId) {
    return buildApiUrl(`/api/content/materials/${material.driveFileId}`);
  }

  return buildApiUrl(material?.driveUrl);
};

export const getFirstImageMaterialUrl = (materials = []) => {
  const imageMaterial = materials.find(isImageMaterial);
  return imageMaterial ? getMaterialUrl(imageMaterial) : "";
};

const getFileExtension = (fileName) => {
  const value = String(fileName || "").toLowerCase();
  const dotIndex = value.lastIndexOf(".");
  return dotIndex >= 0 ? value.slice(dotIndex + 1) : "";
};
