import Joi from "joi";
import BaseDto from "../../../common/dto/base.dto.js";

class CreatePollDto extends BaseDto {
    static schema = Joi.object({
        title: Joi.string().trim().min(3).max(100).required(),
        is_private: Joi.boolean().default(false),
        allow_anonymous: Joi.boolean().default(false),
        is_published: Joi.boolean().default(false),
        expires_at: Joi.date().greater('now').optional(),
        questions: Joi.array().items(
            Joi.object({
                content: Joi.string().trim().min(3).max(255).required(),
                is_required: Joi.boolean().default(false),
                options: Joi.array().items(
                    Joi.object({
                        content: Joi.string().trim().min(1).max(100).required()
                    })
                ).min(2).required()
            })
        ).min(1).required()
    });
}

export default CreatePollDto;
