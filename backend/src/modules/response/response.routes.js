import express from "express"
import * as responseController from "./response.controller.js"
import { optionalProtect } from "../auth/auth.middleware.js"
import validate from "../../common/middleware/validate.middleware.js"
import SubmitResponseDto from "./dto/submit-response.dto.js"

const router = express.Router();

router.post("/", optionalProtect, validate(SubmitResponseDto), responseController.submitResponse);
router.get("/:pollId/results", optionalProtect, responseController.getResults);

export default router;
