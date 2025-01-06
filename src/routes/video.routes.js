import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { uploadVideo,
    updateVideoDetais,
    deleteVideo,
    getVideoByUserIdAgg,
    getVideoById,
    unpublishVideo,
    publishVideo } from "../controllers/video.controller.js";

const router = Router();

router.route("/upload").post(verifyJWT, upload.fields([
    {
        name: "video",
        maxCount: 1,
    },
    {
        name: "thumbnail",
        maxCount: 1
    }
]), uploadVideo)

// likeVideo,
// dislikeVideo,
// addComment,
// getComments
router.route("/update/:id").patch(verifyJWT, updateVideoDetais);
router.route("/delete/:id").delete(verifyJWT, deleteVideo);
router.route("/user/:userId").get(verifyJWT, getVideoByUserIdAgg);
router.route("/:id").get(verifyJWT, getVideoById);
router.route("/unpublish/:id").patch(verifyJWT, unpublishVideo);
router.route("/publish/:id").patch(verifyJWT, publishVideo);


export default router
