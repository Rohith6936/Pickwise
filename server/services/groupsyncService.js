export const createGroup = async ({ users }) => {
  return { sessionId: "g123", users, items: ["Movie1", "Movie2"] };
};

export const getGroup = async (sessionId) => {
  return { sessionId, items: ["Shared Movie A", "Shared Movie B"] };
};
