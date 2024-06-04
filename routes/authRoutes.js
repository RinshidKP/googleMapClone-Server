import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import {
  signup,
  login,
  getUserDetails,
  logout,
  updateUsername,
  validateOtp,
  resendOtp,
  dashboardData,
} from "../controllers/authController.mjs";

const router = express.Router();

router.post("/signup", signup);
router.post("/validateOtp", validateOtp);
router.post('/resendOtp',resendOtp)
router.post("/login", login);
router.get("/user", authenticateToken, getUserDetails);
router.get("/dashboard", authenticateToken, dashboardData);
router.put("/update-username", authenticateToken, updateUsername);
router.post("/logout", logout);

export default router;