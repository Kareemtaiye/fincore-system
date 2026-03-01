import AppError from "../utilities/AppError.js";

export default function unhandledRoutes(req, res, next) {
  return next(
    new AppError(`The route ${req.originalUrl} does not exits on the server!`, 400),
  );
}
