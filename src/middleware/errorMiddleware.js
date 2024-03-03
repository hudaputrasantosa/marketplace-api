const errorMiddleware = (err, req, res, next) => {
    const errorStatus = err.status || 500;
    const errorMessage = err.message || "Something went Wrong!";
    return res.status(errorStatus).send({
        success: false,
        status: errorStatus,
        message: errorMessage,
        stack: err.stack,
    });
};

module.exports = errorMiddleware;