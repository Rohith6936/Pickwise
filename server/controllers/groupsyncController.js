import { createGroup as createGroupService, getGroup as getGroupService } from "../services/groupsyncService.js";
import { ok } from "../utils/responses.js";

export const createGroup = async (req, res, next) => {
  try {
    const result = await createGroupService(req.body);
    res.json(ok(result));
  } catch (err) {
    next(err);
  }
};

export const getGroup = async (req, res, next) => {
  try {
    const result = await getGroupService(req.params.sessionId);
    res.json(ok(result));
  } catch (err) {
    next(err);
  }
};
