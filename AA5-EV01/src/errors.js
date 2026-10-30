/** Error controlado: permite devolver un estado HTTP sin exponer detalles internos. */
export class ApiError extends Error {
  constructor(status, message, details = undefined) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

