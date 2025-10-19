export const updateConfig = async (config) => {
  return { updated: true, config };
};

export const reindex = async () => {
  return { status: "reindex started" };
};
