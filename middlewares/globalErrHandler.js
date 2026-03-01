import AppError from "../utilities/AppError.js";

const { NODE_ENV } = process.env;

function handleJwtError(err) {
  if (err.message === "jwt expired") {
    return new AppError("Access token expired.", 401);
  }
}

function sendDevErro(err, res) {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
  });
}

function sendProdErro(err, res) {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
  });
}

export default async function globalErrHandler(err, _, res, next) {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  console.log("Err: ", err);

  if (NODE_ENV === "development") {
    sendDevErro(err, res);
  } else {
    let error = err;
    // if (err.isOperational) {
    if (err.name === "TokenExpiredError") {
      error = handleJwtError(err);
    }

    sendProdErro(error, res);
    // } else {
    // console.log("Unknown error:", err);
    // res.status(500).json({
    //   status: "error",
    //   message: "Internal server error. please try again",
    // });
    // }
  }
}
