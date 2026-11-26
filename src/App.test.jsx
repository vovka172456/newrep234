
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import App from "./App";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("BookSearch", () => {
  it("отображает поле поиска", () => {
    render(<App />);

    const input = screen.getByRole("textbox");

    expect(input).toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  it("ищет книги и показывает результат", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        docs: [
          {
            key: "/works/OL123W",
            title: "Dune",
            author_name: ["Frank Herbert"],
            first_publish_year: 1965
          }
        ]
      })
    });

    render(<App />);

    const input = screen.getByRole("textbox");

    fireEvent.change(input, {
      target: { value: "Dune" }
    });

    fireEvent.submit(input.closest("form"));

    expect(await screen.findByRole("heading", {
      name: "Dune"
    })).toBeInTheDocument();

    expect(fetch).toHaveBeenCalled();
  });

  it("не отправляет пустой запрос", () => {
    render(<App />);

    const input = screen.getByRole("textbox");

    fireEvent.submit(input.closest("form"));

    expect(fetch).not.toHaveBeenCalled();
  });
});
