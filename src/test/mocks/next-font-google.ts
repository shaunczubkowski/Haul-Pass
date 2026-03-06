function createFontMock() {
  return () => ({
    variable: "",
    className: "",
    style: { fontFamily: "" },
  });
}

export const Geist = createFontMock();
export const Geist_Mono = createFontMock();
export const Inter = createFontMock();
export const Roboto = createFontMock();
