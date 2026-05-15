import * as authService from "./auth.service.js"
import ApiResponse from "../../common/utils/api-response.js"

const register = async (req, res, next) => {
    try {
        const data = await authService.register(req.body)
        ApiResponse.created(res, "Registration success", data)
    } catch (err) {
        next(err)
    }
}

const login = async (req, res, next) => {
    try {
        const data = await authService.login(req.body)
        ApiResponse.ok(res, "Login success", data)
    } catch (err) {
        next(err)
    }
}

export { register, login }