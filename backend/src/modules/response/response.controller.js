import * as responseService from "./response.service.js"
import ApiResponse from "../../common/utils/api-response.js"

const submitResponse = async (req, res) => {
    const { pollId, answers } = req.body;
    const userId = req.user ? (req.user._id ?? req.user.id) : null;
    
    const response = await responseService.submitResponse(userId, pollId, answers);
    ApiResponse.created(res, "Response submitted successfully", response);
}

const getResults = async (req, res) => {
    const viewerId = req.user ? (req.user._id ?? req.user.id) : null;
    const results = await responseService.getPollResults(req.params.pollId, viewerId);
    ApiResponse.ok(res, "Poll results retrieved successfully", results);
}

export {
    submitResponse,
    getResults
}
