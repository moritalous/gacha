import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SECRET } from "../config.ts";
import { readTicket } from "../lib/ticket.ts";
import { AdminApp } from "./AdminApp.tsx";

// jsdom には canvas がないため、QR 画像の生成だけ差し替える
vi.mock("qrcode", () => ({
  default: { toDataURL: vi.fn(async () => "data:image/png;base64,AAAA") },
}));

describe("AdminApp", () => {
  it("合言葉を入力せずにすぐ使える", () => {
    render(<AdminApp />);
    expect(screen.queryByLabelText("合言葉")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "URL と QR コードを発行する" })).toBeEnabled();
  });

  it("発行した URL はガチャ画面で読める", async () => {
    const user = userEvent.setup();
    render(<AdminApp />);

    const label = screen.getByLabelText("1行目のラベル");
    await user.clear(label);
    await user.type(label, "特賞");
    await user.click(screen.getByRole("button", { name: "URL と QR コードを発行する" }));

    const code = await screen.findByText(/#d=/);
    const url = new URL(code.textContent ?? "");
    expect(url.pathname).toBe("/");
    const result = await readTicket(url.hash, SECRET);
    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.config.items[0]?.l).toBe("特賞");
    }
    expect(screen.getByRole("img", { name: /QR コード/ })).toBeInTheDocument();
  });

  it("入力に問題があると発行できない", async () => {
    const user = userEvent.setup();
    render(<AdminApp />);

    for (const index of [1, 2, 3, 4]) {
      const input = screen.getByLabelText(`${index}行目の数`);
      await user.clear(input);
      await user.type(input, "0");
    }
    expect(screen.getByText(/数の合計が 0 です/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "URL と QR コードを発行する" })).toBeDisabled();
  });

  it("行を追加・削除すると確率が変わる", async () => {
    const user = userEvent.setup();
    render(<AdminApp />);

    await user.click(screen.getByRole("button", { name: "＋ 行を追加" }));
    expect(screen.getByLabelText("5行目のラベル")).toHaveValue("5等");
    await user.click(screen.getByRole("button", { name: "5行目を削除" }));
    expect(screen.queryByLabelText("5行目のラベル")).not.toBeInTheDocument();
  });

  it("発行後に設定を変えると、作り直すよう案内する", async () => {
    const user = userEvent.setup();
    render(<AdminApp />);
    await user.click(screen.getByRole("button", { name: "URL と QR コードを発行する" }));
    await screen.findByText(/#d=/);

    await user.type(screen.getByLabelText("1行目のラベル"), "!");
    expect(screen.getByRole("status")).toHaveTextContent("もう一度発行してください");
  });
});
