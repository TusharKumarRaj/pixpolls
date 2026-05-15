import mongoose from "mongoose"
import Response from "./response.model.js"
import Poll from "../poll/poll.model.js"
import ApiError from "../../common/utils/api-error.js"
import { emitToPoll } from "../../realtime/socket-hub.js"

function isPollExpired(poll) {
    return poll.expires_at && new Date() > poll.expires_at;
}

function validateAnswersAgainstPoll(poll, answers) {
    const answerList = Array.isArray(answers) ? answers : [];
    const answeredByQuestion = new Map();

    for (const a of answerList) {
        const qid = String(a.question_id);
        const question = poll.questions.id(qid);
        if (!question) {
            throw ApiError.badRequest("Invalid question in response");
        }
        const option = question.options.id(String(a.option_id));
        if (!option) {
            throw ApiError.badRequest("Invalid option in response");
        }
        if (answeredByQuestion.has(qid)) {
            throw ApiError.badRequest("Only one answer per question is allowed");
        }
        answeredByQuestion.set(qid, true);
    }

    for (const q of poll.questions) {
        if (q.is_required && !answeredByQuestion.has(String(q._id))) {
            throw ApiError.badRequest("Answer every required question");
        }
    }

    if (answerList.length < 1) {
        throw ApiError.badRequest("Select at least one answer");
    }
}

const submitResponse = async (userId, pollId, answers) => {
    const poll = await Poll.findById(pollId);
    if (!poll) {
        throw ApiError.notFound("Poll not found");
    }

    if (!poll.is_published) {
        throw ApiError.badRequest("Poll is not published yet");
    }
    if (poll.results_published) {
        throw ApiError.badRequest("This poll is closed — final results have been published");
    }
    if (isPollExpired(poll)) {
        throw ApiError.badRequest("Poll has expired");
    }

    if (!userId && !poll.allow_anonymous) {
        throw ApiError.unauthorized("Authentication required for this poll");
    }

    validateAnswersAgainstPoll(poll, answers);

    const doc = {
        poll_id: pollId,
        answers
    };
    if (userId) {
        doc.user_id = userId;
    }

    try {
        const created = await Response.create(doc);
        emitToPoll(pollId, "poll:responses", { pollId: String(pollId) });
        return created;
    } catch (err) {
        if (err && err.code === 11000) {
            throw ApiError.conflict("You have already submitted a response to this poll");
        }
        throw err;
    }
}

const getPollResults = async (pollId, viewerUserId = null) => {
    if (!mongoose.Types.ObjectId.isValid(pollId)) {
        throw ApiError.notFound("Poll not found");
    }

    const poll = await Poll.findById(pollId);
    if (!poll) {
        throw ApiError.notFound("Poll not found");
    }

    const ownerId = poll.user_id;
    const viewerStr = viewerUserId != null ? String(viewerUserId) : null;
    const isOwner = viewerStr && ownerId && String(ownerId) === viewerStr;

    if (!isOwner && !poll.results_published) {
        throw ApiError.forbidden("Results are not published yet");
    }

    const pollOid = new mongoose.Types.ObjectId(pollId);
    const totalResponses = await Response.countDocuments({ poll_id: pollOid });

    const byQuestion = await Response.aggregate([
        { $match: { poll_id: pollOid } },
        { $unwind: "$answers" },
        {
            $group: {
                _id: {
                    question_id: "$answers.question_id",
                    option_id: "$answers.option_id"
                },
                count: { $sum: 1 }
            }
        },
        {
            $group: {
                _id: "$_id.question_id",
                options: {
                    $push: {
                        option_id: "$_id.option_id",
                        count: "$count"
                    }
                }
            }
        }
    ]);

    const requiredCount = poll.questions.filter((q) => q.is_required).length;
    const optionalCount = poll.questions.length - requiredCount;

    return {
        total_responses: totalResponses,
        participation: {
            question_count: poll.questions.length,
            required_question_count: requiredCount,
            optional_question_count: optionalCount,
            allow_anonymous: poll.allow_anonymous,
            is_closed: Boolean(poll.results_published),
            expired: isPollExpired(poll)
        },
        by_question: byQuestion
    };
}

export {
    submitResponse,
    getPollResults
}
