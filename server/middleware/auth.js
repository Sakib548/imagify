import "dotenv/config";
import jwt from "jsonwebtoken";

const authUser = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication Failed " });
  }

  const token = authHeader.split("Bearer ")[1];
  if (!token) {
    return res.status(401).json({ message: "Authentication Invalid " });
  }

  try {
    const decode = jwt.verify(token, process.env.JWT_SECRET);

    if (decode.id) {
      req.body.userId = decode.id;
    } else {
      return res.status(401).json({ message: "Not Authorized login again " });
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default authUser;
