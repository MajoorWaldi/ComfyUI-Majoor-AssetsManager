function r(e) {
  return {
    priority: 0,
    description: "",
    canHandle: () => !1,
    extractMedia: () => null,
    ...e
  };
}
export {
  r as createAdapter
};
