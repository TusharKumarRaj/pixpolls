import mongoose from "mongoose";

const optionSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, "Option content is required"],
        trim: true,
        maxlength: 100
    }
});

const questionSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, "Question content is required"],
        trim: true,
        maxlength: 255
    },
    is_required: {
        type: Boolean,
        default: false
    },
    options: {
        type: [optionSchema],
        validate: [v => v.length >= 2, "A question must have at least 2 options"]
    }
});

const pollSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        title: {
            type: String,
            required: [true, "Poll title is required"],
            trim: true,
            maxlength: 100
        },
        is_private: {
            type: Boolean,
            default: false
        },
        allow_anonymous: {
            type: Boolean,
            default: false
        },
        is_published: {
            type: Boolean,
            default: false
        },
        results_published: {
            type: Boolean,
            default: false
        },
        expires_at: {
            type: Date
        },
        questions: {
            type: [questionSchema],
            validate: [v => v.length >= 1, "A poll must have at least 1 question"]
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model("Poll", pollSchema);
