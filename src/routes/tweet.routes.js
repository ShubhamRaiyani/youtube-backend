import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import { createTweet,deleteTweet, updateTweet , getUserTweets } from "../controllers/tweet.controller.js";


const router = Router();

router.route("/create").post(verifyJWT, createTweet);
router.route("/delete/:id").delete(verifyJWT, deleteTweet);
router.route("/update/:id").patch(verifyJWT, updateTweet);
router.route("/all-tweets").get(verifyJWT, getUserTweets);

export default router
