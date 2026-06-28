export const formatMonth = (yyyyMm: string) =>
  new Date(`${yyyyMm}-01T12:00:00`).toLocaleString("es-CL", {
    month: "long",
    year: "numeric",
  });
