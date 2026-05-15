import { Router } from "express";
import * as controller from "./auth.controller.js"
import RegisterDto from "./dto/register.dto.js"
import LoginDto from "./dto/login.dto.js"
import validate from "../../common/middleware/validate.middleware.js"

const router = Router()

router.post("/register", validate(RegisterDto), controller.register)
router.post("/login", validate(LoginDto), controller.login)

export default router;