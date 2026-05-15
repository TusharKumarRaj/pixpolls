import * as pollService from "./poll.service.js"
import ApiResponse from "../../common/utils/api-response.js"

const createPoll = async (req, res) => {
    const ownerId = req.user._id ?? req.user.id;
    const poll = await pollService.createPoll(ownerId, req.body);
    ApiResponse.created(res, "Poll created successfully", poll);
}

const listPolls = async (req, res) => {
    const polls = await pollService.listPolls(req.query);
    ApiResponse.ok(res, "Polls retrieved successfully", polls);
}

const listMyPolls = async (req, res) => {
    const ownerId = req.user._id ?? req.user.id;
    const polls = await pollService.listMyPolls(ownerId);
    ApiResponse.ok(res, "Polls retrieved successfully", polls);
}

const getPoll = async (req, res) => {
    const viewerId = req.user ? (req.user._id ?? req.user.id) : null;
    const poll = await pollService.getPollById(req.params.id, viewerId);
    ApiResponse.ok(res, "Poll retrieved successfully", poll);
}

const updatePoll = async (req, res) => {
    const ownerId = req.user._id ?? req.user.id;
    const poll = await pollService.updatePoll(ownerId, req.params.id, req.body);
    ApiResponse.ok(res, "Poll updated successfully", poll);
}

const deletePoll = async (req, res) => {
    const ownerId = req.user._id ?? req.user.id;
    await pollService.deletePoll(ownerId, req.params.id);
    ApiResponse.ok(res, "Poll deleted successfully");
}

export {
    createPoll,
    listPolls,
    listMyPolls,
    getPoll,
    updatePoll,
    deletePoll
}
