import User from "./auth.model.js"
import ApiError from "../../common/utils/api-error.js"
import { verifyToken } from "../../common/utils/jwt.utils.js"

const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return next(ApiError.unauthorized("You are not logged in! Please log in to get access."));
        }

        const decoded = verifyToken(token);

        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return next(ApiError.unauthorized("The user belonging to this token no longer exists."));
        }

        req.user = currentUser;
        next();
    } catch (error) {
        next(ApiError.unauthorized("Invalid token. Please log in again."));
    }
}

const optionalProtect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return next();
        }

        const decoded = verifyToken(token);
        const currentUser = await User.findById(decoded.id);
        
        if (currentUser) {
            req.user = currentUser;
        }
        
        next();
    } catch (error) {
        next(); // Proceed as guest if token is invalid
    }
}

export { protect, optionalProtect }
