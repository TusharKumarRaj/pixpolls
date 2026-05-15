import Joi from "joi";
import BaseDto from "../../../common/dto/base.dto.js";

class SubmitResponseDto extends BaseDto {
    static schema = Joi.object({
        pollId: Joi.string().hex().length(24).required(),
        answers: Joi.array().items(
            Joi.object({
                question_id: Joi.string().hex().length(24).required(),
                option_id: Joi.string().hex().length(24).required()
            })
        ).min(1).required()
    });
}

export default SubmitResponseDto;
