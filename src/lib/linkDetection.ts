// Detecta links em texto: URLs, www, domínios comuns, encurtadores
const LINK_REGEX = new RegExp(
  [
    "https?:\\/\\/\\S+", // http:// ou https://
    "www\\.\\S+", // www.algo
    "\\b\\S+\\.(com|br|net|org|io|co|gov|edu|info|biz|app|dev|me|tv|xyz|site|online|store|tech|us|uk|de|fr|es|it|pt|ar|mx|cl|ca|au|jp|cn|ru|in)(\\/\\S*)?\\b", // domínios
    "\\b(bit\\.ly|tinyurl\\.com|t\\.co|goo\\.gl|ow\\.ly|is\\.gd|buff\\.ly|adf\\.ly|shorte\\.st|cutt\\.ly|rebrand\\.ly|short\\.io|rb\\.gy|t\\.me)\\/\\S*", // encurtadores
  ].join("|"),
  "i"
);

export const containsLink = (text: string): boolean => {
  if (!text) return false;
  return LINK_REGEX.test(text);
};

export const LINK_NOT_ALLOWED_MESSAGE = "Links não são permitidos nas publicações.";
