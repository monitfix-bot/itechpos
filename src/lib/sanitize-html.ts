// Print templates are admin-editable HTML, then mixed with customer/sale data
// (customer name, problem description, IMEI, …) before being rendered with
// dangerouslySetInnerHTML. The substituted values are not HTML-escaped, so a
// customer name like `<img src=x onerror=…>` lands directly in the DOM.
//
// We sanitize the FINAL rendered HTML once, right before it is handed to
// React. The allow-list below keeps everything a receipt actually needs
// (typography, tables, images, basic inline styles) while removing scripts,
// event handlers, iframes, etc.
//
// We intentionally allow <img> with http(s) and data: URIs because the
// VietQR helper in template-engine.ts emits an <img src="https://…">.
const ALLOWED_TAGS = [
  "div",
  "span",
  "p",
  "br",
  "hr",
  "b",
  "strong",
  "i",
  "em",
  "u",
  "small",
  "sub",
  "sup",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "td",
  "th",
  "ul",
  "ol",
  "li",
  "img",
  "a",
  "section",
  "header",
  "footer",
  "main",
  "article",
  "aside",
  "nav",
  "figure",
  "figcaption",
  "blockquote",
  "code",
  "pre",
];

const ALLOWED_ATTR = [
  "style",
  "class",
  "id",
  "src",
  "alt",
  "title",
  "href",
  "target",
  "rel",
  "width",
  "height",
  "colspan",
  "rowspan",
  "align",
  "valign",
  "border",
  "cellspacing",
  "cellpadding",
  "data-print",
];

function stripDangerousHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    .replace(/\son\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, "")
    .replace(/javascript\s*:/gi, "");
}

export function sanitizeTemplateHtml(html: string): string {
  if (!html) return "";

  // On Server (Node.js / Vercel Serverless Function):
  // Use fast, lightweight regex sanitization to avoid JSDOM module initialization crash on serverless runtime.
  if (typeof window === "undefined") {
    return stripDangerousHtml(html);
  }

  // In Browser: use DOMPurify if available
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const dompurify = require("dompurify");
    const sanitize = (dompurify.default || dompurify).sanitize;
    if (typeof sanitize === "function") {
      return sanitize(html, {
        ALLOWED_TAGS,
        ALLOWED_ATTR,
        ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
        FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input", "button"],
        FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus"],
      });
    }
  } catch (err) {
    console.warn("DOMPurify browser sanitize fallback:", err);
  }

  return stripDangerousHtml(html);
}
