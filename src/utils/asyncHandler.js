// method 1

const asyncHandler = (requestHanlder) => {
  console.log("requestHanlder ===> ", requestHanlder);
  return (req, res, next) => {
    // console.log("req ===> ", req);
    Promise.resolve(requestHanlder(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };

// const asyncHandler = () = {}
// const asyncHandler = (func) =>  => {}
// const asyncHandler = (fnnc) => async () => {}

// method 2

// const asyncHandler = (fn) => async (req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (error) {
//     res.status(err.code || 500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };
