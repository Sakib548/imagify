import express from "express";

import {
  loginUser,
  paymentStripe,
  registerUser,
  userCredits,
  verifyStripe,
} from "../controllers/userController.js";
import authUser from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/credits", authUser, userCredits);
userRouter.post("/stripe", authUser, paymentStripe);
userRouter.post("/verifyStripe", authUser, verifyStripe);
export default userRouter;
