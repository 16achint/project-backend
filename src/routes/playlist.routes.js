import { Router } from "express";
import { createPlaylist } from "../controllers/playlist.controller";
import { verifyJWT } from "../middlewares/auth.middleware";
const router = Router();

router.use(verifyJWT);
router.route("/").post(createPlaylist);
