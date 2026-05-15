import mongoose from "mongoose"
import Poll from "./poll.model.js"
import ApiError from "../../common/utils/api-error.js"
import { emitToPoll } from "../../realtime/socket-hub.js"

const createPoll = async (userId, pollData) => {
    const poll = await Poll.create({
        ...pollData,
        user_id: userId
    });
    return poll;
}

const getPollById = async (pollId, viewerUserId = null) => {
    if (!mongoose.Types.ObjectId.isValid(pollId)) {
        throw ApiError.notFound("Poll not found");
    }

    const poll = await Poll.findById(pollId).populate("user_id", "name email");
    if (!poll) {
        throw ApiError.notFound("Poll not found");
    }

    const ownerId = poll.user_id?._id ?? poll.user_id;
    const viewerStr = viewerUserId != null ? String(viewerUserId) : null;
    const isOwner =
        viewerStr && ownerId && String(ownerId) === viewerStr;

    const guestMayView =
        poll.results_published || (poll.is_published && !poll.is_private);
    if (!isOwner && !guestMayView) {
        throw ApiError.notFound("Poll not found");
    }

    return poll;
}

const listPolls = async (query = {}) => {
    const filter = {
        is_private: false,
        is_published: true
    };
    const uid = query.user_id;
    if (uid != null && uid !== "" && mongoose.Types.ObjectId.isValid(String(uid))) {
        filter.user_id = uid;
    }

    const polls = await Poll.find(filter).sort("-createdAt").populate("user_id", "name email");
    return polls;
}

const listMyPolls = async (userId) => {
    if (userId == null) {
        throw ApiError.badRequest("User ID is required");
    }
    let ownerId;
    if (userId instanceof mongoose.Types.ObjectId) {
        ownerId = userId;
    } else {
        const s = String(userId);
        if (!mongoose.Types.ObjectId.isValid(s)) {
            throw ApiError.badRequest("Invalid user ID");
        }
        ownerId = new mongoose.Types.ObjectId(s);
    }

    const polls = await Poll.find({ user_id: ownerId })
        .sort("-createdAt")
        .populate("user_id", "name email");
    return polls;
}

const updatePoll = async (userId, pollId, updateData) => {
    if (!mongoose.Types.ObjectId.isValid(pollId)) {
        throw ApiError.notFound("Poll not found or you are not authorized");
    }

    const poll = await Poll.findOne({ _id: pollId, user_id: userId });
    if (!poll) {
        throw ApiError.notFound("Poll not found or you are not authorized");
    }
    
    Object.assign(poll, updateData);
    await poll.save();
    emitToPoll(poll._id, "poll:updated", { pollId: String(poll._id) });
    return poll;
}

const deletePoll = async (userId, pollId) => {
    if (!mongoose.Types.ObjectId.isValid(pollId)) {
        throw ApiError.notFound("Poll not found or you are not authorized");
    }

    const poll = await Poll.findOneAndDelete({ _id: pollId, user_id: userId });
    if (!poll) {
        throw ApiError.notFound("Poll not found or you are not authorized");
    }
    emitToPoll(pollId, "poll:deleted", { pollId: String(pollId) });
    return poll;
}

export {
    createPoll,
    getPollById,
    listPolls,
    listMyPolls,
    updatePoll,
    deletePoll
}
