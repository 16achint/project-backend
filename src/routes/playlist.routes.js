import { Router } from "express";
import {
  createPlaylist,
  getUserPlayList,
  getPlaylistbyId,
  addVideotoPlaylist,
  removeVideoFromPlaylist,
  deletePlayList,
  updatePlaylist,
} from "../controllers/playlist.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();
router.use(verifyJWT);

router.route("/").post(createPlaylist);

router
  .route("/:playlistId")
  .get(getPlaylistbyId)
  .patch(updatePlaylist)
  .delete(deletePlayList);

router.route("/user/:userId").get(getUserPlayList);

router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);
router.route("/add/:videoId/:playlistId").patch(addVideotoPlaylist);

export default router;
