export const ok = (data) => ({
  success: true,
  data,
});

export const fail = (code, message) => ({
  success: false,
  error: { code, message },
});
