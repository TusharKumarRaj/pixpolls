import Joi from "joi";
import BaseDto from "../../../common/dto/base.dto.js";

class RegisterDto extends BaseDto{
    static schema = Joi.object({
        name: Joi.string().trim().min(2).max(50).required(),
        email: Joi.string().trim().email({ tlds: { allow: false } }).required(),
        password: Joi.string().min(8).max(72).required(),
    })
}

export default RegisterDto