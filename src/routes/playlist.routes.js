import { Router } from "express";
import {
  createPlaylist,
  getUserPlayList,
  getPlaylistbyId,
  addVideotoPlaylist,
  removeVideoFromPlaylist,
  deletePlayList,
  updatePlaylist,
} from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/").post(verifyJWT, createPlaylist);

router
  .route("/:playlistId")
  .get(getPlaylistbyId)
  .patch(verifyJWT, updatePlaylist)
  .delete(verifyJWT, deletePlayList);

router.route("/user/:userId").get(getUserPlayList);

router
  .route("/remove/:videoId/:playlistId")
  .patch(verifyJWT, removeVideoFromPlaylist);
router.route("/add/:videoId/:playlistId").patch(verifyJWT, addVideotoPlaylist);

export default router;
