import Joi from "joi";
import BaseDto from "../../../common/dto/base.dto.js";

class UpdatePollDto extends BaseDto {
    static schema = Joi.object({
        title: Joi.string().trim().min(3).max(100).optional(),
        is_private: Joi.boolean().optional(),
        allow_anonymous: Joi.boolean().optional(),
        is_published: Joi.boolean().optional(),
        results_published: Joi.boolean().optional(),
        expires_at: Joi.date().greater('now').optional()
    });
}

export default UpdatePollDto;
