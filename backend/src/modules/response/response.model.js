import mongoose from "mongoose";

const answerSchema = new mongoose.Schema({
    question_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "Question ID is required"]
    },
    option_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "Option ID is required"]
    }
});

const responseSchema = new mongoose.Schema(
    {
        poll_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Poll",
            required: [true, "Poll ID is required"]
        },
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false // Nullable for anonymous responses
        },
        answers: {
            type: [answerSchema],
            validate: [v => v.length >= 1, "A response must have at least 1 answer"]
        }
    },
    {
        timestamps: { createdAt: true, updatedAt: false } // We only need createdAt for responses
    }
);

// Ensure a user can only respond once per poll (if not anonymous)
responseSchema.index(
    { poll_id: 1, user_id: 1 },
    {
        unique: true,
        partialFilterExpression: { user_id: { $type: "objectId" } }
    }
);

export default mongoose.model("Response", responseSchema);
