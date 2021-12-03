export const createUrlSlug = (text: string): string => {
  return text
    .trim()
    .replace(
      /[^0-9a-zA-Zㄱ-힣.\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf -]/g,
      ''
    )
    .trim()
    .replace(/ /g, '-')
    .replace(/--+/g, '-');
};

export const genSubSlug = (): string => {
  return `${Math.floor(36 + Math.random() * 1259).toString(36)}${Date.now().toString(36)}`;
};
