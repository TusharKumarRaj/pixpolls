import Joi from "joi";
import BaseDto from "../../../common/dto/base.dto.js";


class LoginDto extends BaseDto {
    static schema = Joi.object({
        email: Joi.string().trim().email({ tlds: { allow: false } }).required(),
        password: Joi.string().required()
    })
}

export default LoginDto
