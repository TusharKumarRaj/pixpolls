import express from "express"
import * as pollController from "./poll.controller.js"
import { protect, optionalProtect } from "../auth/auth.middleware.js"
import validate from "../../common/middleware/validate.middleware.js"
import CreatePollDto from "./dto/create-poll.dto.js"
import UpdatePollDto from "./dto/update-poll.dto.js"

const router = express.Router();

// Public routes
router.get("/", pollController.listPolls);
router.get("/mine", protect, pollController.listMyPolls);
router.get("/:id", optionalProtect, pollController.getPoll);

// Protected routes (create / update / delete — not /mine, already registered above)
router.use(protect);

router.post("/", validate(CreatePollDto), pollController.createPoll);
router.patch("/:id", validate(UpdatePollDto), pollController.updatePoll);
router.delete("/:id", pollController.deletePoll);

export default router;
