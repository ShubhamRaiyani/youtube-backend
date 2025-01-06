import { Router } from 'express';
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
} from "../controllers/subscription.controller.js";

const router = Router();
router.route("/toggle-subscription/:channelId").post(verifyJWT, toggleSubscription)

router.route("/subcribers").get(verifyJWT ,getUserChannelSubscribers)
router.route("/channel-subcribed").get(verifyJWT, getSubscribedChannels)

export default router