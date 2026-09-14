import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LanguageProvider } from "@/lib/i18n/language-context";
import { QuoteFormSection } from "./quote-form-section";

// The provider reads the locale from the route.
vi.mock("next/navigation", () => ({
  usePathname: () => "/bg",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

function renderForm() {
  return render(
    <LanguageProvider>
      <QuoteFormSection />
    </LanguageProvider>
  );
}

function nextButton() {
  return screen.getByRole("button", { name: "Напред" });
}

/** The wizard opens on the service cards - pick "AI video" (first card) via its quote pill. */
async function pickVideo(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getAllByRole("button", { name: "Поискай оферта" })[0]!);
}

async function pickRadio(user: ReturnType<typeof userEvent.setup>, name: RegExp | string) {
  await user.click(screen.getByRole("radio", { name }));
}

/** Walk the wizard to the contact step with a minimal valid selection. */
async function walkToContact(user: ReturnType<typeof userEvent.setup>) {
  await pickVideo(user);
  await pickRadio(user, /Не, искам вие да го напишете/);
  await user.click(nextButton());
  await pickRadio(user, /Да увеличи продажбите/);
  await user.click(nextButton());
  await user.click(screen.getByRole("checkbox", { name: /Вертикално/ }));
  await pickRadio(user, "Не");
  await user.click(nextButton());
  await user.click(nextButton()); // details step is optional
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("QuoteFormSection wizard", () => {
  it("starts on the service cards; the AI video pill opens the script step with Next disabled", async () => {
    const user = userEvent.setup();
    renderForm();

    expect(screen.getAllByRole("button", { name: "Поискай оферта" })).toHaveLength(4);
    await pickVideo(user);
    expect(screen.getByText("Имате ли готов сюжет?")).toBeTruthy();
    expect(nextButton()).toHaveProperty("disabled", true);

    await pickRadio(user, /Не, искам вие да го напишете/);
    expect(nextButton()).toHaveProperty("disabled", false);
  });

  it("gates each step on its required answers", async () => {
    const user = userEvent.setup();
    renderForm();

    await pickVideo(user);
    await pickRadio(user, /Не, искам вие да го напишете/);
    await user.click(nextButton());
    expect(screen.getByText("Каква е основната цел на видеото?")).toBeTruthy();
    expect(nextButton()).toHaveProperty("disabled", true);

    await pickRadio(user, /Да увеличи продажбите/);
    await user.click(nextButton());
    expect(screen.getByText("Детайли за видеото")).toBeTruthy();

    // Format alone is not enough — voice-over is required too.
    await user.click(screen.getByRole("checkbox", { name: /Вертикално/ }));
    expect(nextButton()).toHaveProperty("disabled", true);
    await pickRadio(user, "Не");
    expect(nextButton()).toHaveProperty("disabled", false);
  });

  it("accumulates multi-select choices instead of replacing them", async () => {
    // Regression: OptionCard is memoized on props, so an unchanged card keeps
    // an older onSelect closure. Handlers reading form state directly made
    // picking one format/platform silently unselect the other.
    const user = userEvent.setup();
    renderForm();

    await pickVideo(user);
    await pickRadio(user, /Не, искам вие да го напишете/);
    await user.click(nextButton());
    await pickRadio(user, /Да увеличи продажбите/);
    await user.click(nextButton());

    const vertical = screen.getByRole("checkbox", { name: /Вертикално/ });
    const horizontal = screen.getByRole("checkbox", { name: /Хоризонтално/ });

    await user.click(vertical);
    await user.click(horizontal);
    expect(vertical).toHaveProperty("ariaChecked", "true");
    expect(horizontal).toHaveProperty("ariaChecked", "true");

    // Deselecting one must leave the other alone.
    await user.click(vertical);
    expect(vertical).toHaveProperty("ariaChecked", "false");
    expect(horizontal).toHaveProperty("ariaChecked", "true");

    // Same contract on the platforms group (details step).
    await pickRadio(user, "Не");
    await user.click(nextButton());

    const instagram = screen.getByRole("checkbox", { name: /Instagram/ });
    const youtube = screen.getByRole("checkbox", { name: /YouTube/ });
    const facebook = screen.getByRole("checkbox", { name: /Facebook/ });

    await user.click(instagram);
    await user.click(youtube);
    await user.click(facebook);
    expect(instagram).toHaveProperty("ariaChecked", "true");
    expect(youtube).toHaveProperty("ariaChecked", "true");
    expect(facebook).toHaveProperty("ariaChecked", "true");

    await user.click(youtube);
    expect(instagram).toHaveProperty("ariaChecked", "true");
    expect(youtube).toHaveProperty("ariaChecked", "false");
    expect(facebook).toHaveProperty("ariaChecked", "true");
  });

  it("supports going back without losing answers", async () => {
    const user = userEvent.setup();
    renderForm();

    await pickVideo(user);
    await pickRadio(user, /Не, искам вие да го напишете/);
    await user.click(nextButton());
    await user.click(screen.getByRole("button", { name: "Назад" }));

    expect(screen.getByText("Имате ли готов сюжет?")).toBeTruthy();
    expect(
      screen.getByRole("radio", { name: /Не, искам вие да го напишете/ })
    ).toHaveProperty("ariaChecked", "true");

    // Back from the first flow step returns to the service cards.
    await user.click(screen.getByRole("button", { name: "Изберете друга услуга" }));
    expect(screen.getAllByRole("button", { name: "Поискай оферта" })).toHaveLength(4);
  });

  it("opens the AI images flow from its card and gates the specs step", async () => {
    const user = userEvent.setup();
    renderForm();

    // Cards follow services.items order: video, mascot, images, automation.
    await user.click(screen.getAllByRole("button", { name: "Поискай оферта" })[2]!);
    expect(screen.getByText("Какви изображения ви трябват?")).toBeTruthy();
    expect(nextButton()).toHaveProperty("disabled", true);

    await pickRadio(user, "1-5");
    await pickRadio(user, "4K");
    expect(nextButton()).toHaveProperty("disabled", true);
    await user.click(screen.getByRole("checkbox", { name: /9:16/ }));
    expect(nextButton()).toHaveProperty("disabled", false);

    await user.click(nextButton());
    expect(screen.getByText("Опишете изображенията")).toBeTruthy();
    expect(nextButton()).toHaveProperty("disabled", true);
    await user.type(screen.getByLabelText(/Какво трябва да показват/), "Три продукта на бял фон");
    expect(nextButton()).toHaveProperty("disabled", false);
  });

  it("clears pasted script text when switching to \"no script\"", async () => {
    const user = userEvent.setup();
    renderForm();

    await pickVideo(user);
    await pickRadio(user, /Да, имам готов сюжет/);
    await user.type(screen.getByLabelText(/Опишете идеята или сюжета/), "стар текст");
    await pickRadio(user, /Не, искам вие да го напишете/);
    await pickRadio(user, /Да, имам готов сюжет/);

    const textarea = screen.getByLabelText(/Опишете идеята или сюжета/) as HTMLTextAreaElement;
    expect(textarea.value).toBe("");
  });

  it("submits the collected answers and shows the confirmation screen", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true, id: "1" }), { status: 200 })
      );
    renderForm();

    await walkToContact(user);
    expect(screen.getByText("Данни за връзка")).toBeTruthy();

    const submit = screen.getByRole("button", { name: /Изпратете запитване/ });
    expect(submit).toHaveProperty("disabled", true);

    await user.type(screen.getByLabelText(/^Име\s*\*?$/), "Тест Тестов");
    await user.type(screen.getByLabelText(/^Имейл/), "test@example.com");
    await user.click(screen.getByRole("checkbox", { name: /Общите условия/ }));
    expect(submit).toHaveProperty("disabled", false);

    await user.click(submit);

    await waitFor(() =>
      expect(screen.getByText("Получихме запитването ви!")).toBeTruthy()
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/quote");
    const body = init?.body as FormData;
    const payload = JSON.parse(String(body.get("payload")));
    expect(payload).toMatchObject({
      service: "video",
      script: "none",
      goal: "sales",
      formats: ["vertical"],
      voiceover: "no",
      name: "Тест Тестов",
      email: "test@example.com",
      termsAccepted: true,
      language: "bg",
    });
  });

  it("shows the error card when the API fails and allows retry", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: false }), { status: 500 })
    );
    renderForm();

    await walkToContact(user);
    await user.type(screen.getByLabelText(/^Име\s*\*?$/), "Тест");
    await user.type(screen.getByLabelText(/^Имейл/), "t@e.io");
    await user.click(screen.getByRole("checkbox", { name: /Общите условия/ }));
    await user.click(screen.getByRole("button", { name: /Изпратете запитване/ }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    // Still on the contact step — the user can fix things and retry.
    expect(screen.getByText("Данни за връзка")).toBeTruthy();
  });
});
