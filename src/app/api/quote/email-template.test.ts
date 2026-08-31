// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  buildQuoteEmailHtml,
  buildQuoteEmailText,
  type QuoteEmailInput,
} from "./email-template";

const base: QuoteEmailInput = {
  title: "Заявка за видео",
  subtitle: "Тест Тестов",
  footerNote: "Автоматично генерирано.",
  sections: [
    {
      title: "Контакт",
      fields: [
        { label: "Име", value: "Тест Тестов" },
        { label: "Имейл", value: "test@example.com" },
        { label: "Компания", value: "" },
      ],
    },
    {
      title: "Сюжет",
      fields: [
        { label: "Описание", value: "Ред 1\nРед 2", multiline: true },
      ],
    },
  ],
};

describe("buildQuoteEmailHtml", () => {
  it("renders title, subtitle, sections and fields", () => {
    const html = buildQuoteEmailHtml(base);
    expect(html).toContain("Заявка за видео");
    expect(html).toContain("Тест Тестов");
    expect(html).toContain("Контакт");
    expect(html).toContain("test@example.com");
    expect(html).toContain("Автоматично генерирано.");
  });

  it("escapes HTML in every interpolated value", () => {
    const html = buildQuoteEmailHtml({
      ...base,
      title: '<script>alert("x")</script>',
      sections: [
        {
          title: "<b>секция</b>",
          fields: [{ label: "<i>поле</i>", value: '"quoted" & <tagged>' }],
        },
      ],
    });
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<b>секция</b>");
    expect(html).not.toContain("<tagged>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&quot;quoted&quot; &amp; &lt;tagged&gt;");
  });

  it("renders empty values as a dash", () => {
    const html = buildQuoteEmailHtml(base);
    // The empty Компания field must still render, with "-" as its value.
    expect(html).toContain("Компания");
    expect(html).toMatch(/Компания[\s\S]*?>-</);
  });

  it("renders multiline values in a pre-wrap block", () => {
    const html = buildQuoteEmailHtml(base);
    expect(html).toContain("white-space:pre-wrap");
    expect(html).toContain("Ред 1\nРед 2");
  });
});

describe("buildQuoteEmailText", () => {
  it("renders sections with label:value lines", () => {
    const text = buildQuoteEmailText(base);
    expect(text).toContain("== Контакт ==");
    expect(text).toContain("Име: Тест Тестов");
    expect(text).toContain("Компания: -");
  });

  it("puts multiline values on their own lines", () => {
    const text = buildQuoteEmailText(base);
    expect(text).toContain("Описание:\nРед 1\nРед 2");
  });
});
