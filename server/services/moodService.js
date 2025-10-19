export const setMood = async (userId, { mood }) => {
  return { userId, mood, updated: true };
};
