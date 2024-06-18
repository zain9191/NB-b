// const jwt = require("jsonwebtoken");

// module.exports = function (req, res, next) {
//   const authHeader = req.header("Authorization");

//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     return res.status(401).json({ msg: "No token, authorization denied" });
//   }

//   const token = authHeader.split(" ")[1];

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     console.log("decoded:", decoded); // Log the decoded token for debugging
//     if (!decoded || !decoded.user || !decoded.user.id) {
//       throw new Error("Token does not contain valid user information");
//     }
//     req.user = decoded.user;
//     next();
//   } catch (err) {
//     console.error("Token verification failed:", err);
//     res.status(401).json({ msg: "Token is not valid" });
//   }
// };

// middleware/auth.js
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("decoded:", decoded); // Log the decoded token for debugging
    if (!decoded || !decoded.user || !decoded.user.id) {
      throw new Error("Token does not contain valid user information");
    }
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    res.status(401).json({ msg: "Token is not valid" });
  }
};
