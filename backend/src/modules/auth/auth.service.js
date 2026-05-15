import User from "./auth.model.js"
import ApiError from "../../common/utils/api-error.js"
import { signToken } from "../../common/utils/jwt.utils.js"

const register = async({name, email, password}) => {
    const existing = await User.findOne({email})
    if(existing) throw ApiError.conflict("Email already exists")

    const user = await User.create({
        name,
        email,
        password    
    })

    const token = signToken({ id: user._id });
    
    return {
        user: {
            id: user._id,
            name: user.name,
            email: user.email
        },
        token
    }
}

const login = async({email, password}) => {
    if (!email || !password) {
        throw ApiError.badRequest("Please provide email and password");
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
        throw ApiError.unauthorized("Incorrect email or password");
    }

    const token = signToken({ id: user._id });

    return {
        user: {
            id: user._id,
            name: user.name,
            email: user.email
        },
        token
    }
}

export { register, login }