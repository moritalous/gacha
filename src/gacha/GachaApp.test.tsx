import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { SECRET } from "../config.ts";
import type { EventConfig } from "../lib/event.ts";
import { issueTicket } from "../lib/ticket.ts";
import { memoryStore, sampleConfig } from "../test/fixtures.ts";
import { GachaApp } from "./GachaApp.tsx";

async function openWith(config: EventConfig, secret = SECRET): Promise<void> {
  const { d, h } = await issueTicket(config, secret);
  window.location.hash = new URLSearchParams({ d, h }).toString();
}

describe("GachaApp", () => {
  beforeEach(() => {
    window.location.hash = "";
  });

  it("URL に設定がなければ案内を出す", async () => {
    render(<GachaApp store={memoryStore()} spinMs={0} />);
    expect(await screen.findByText("QR コードから開いてください")).toBeInTheDocument();
  });

  it("書き換えられた URL は無効と表示する", async () => {
    await openWith(sampleConfig(), "other-secret");
    render(<GachaApp store={memoryStore()} spinMs={0} />);
    expect(await screen.findByText("無効な QR コードです")).toBeInTheDocument();
  });

  it("保存領域が使えなくても回せる", async () => {
    const user = userEvent.setup();
    await openWith(sampleConfig());
    render(<GachaApp store={null} spinMs={0} />);
    await user.click(await screen.findByRole("button", { name: "ガチャを回す" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("何度でも回せて、最近の結果が新しい順に並ぶ", async () => {
    const user = userEvent.setup();
    await openWith(sampleConfig());
    render(<GachaApp store={memoryStore()} spinMs={0} />);

    for (let i = 0; i < 3; i++) {
      await user.click(await screen.findByRole("button", { name: "ガチャを回す" }));
      const dialog = await screen.findByRole("dialog");
      expect(within(dialog).getByRole("heading").textContent).toMatch(/^(1等|2等)$/);
      await user.click(within(dialog).getByRole("button", { name: "閉じる" }));
    }

    expect(screen.getByRole("button", { name: "ガチャを回す" })).toBeEnabled();
    expect(within(screen.getByRole("list")).getAllByRole("listitem")).toHaveLength(3);
  });

  it("回している間は、今回の結果を履歴に出さない", async () => {
    const user = userEvent.setup();
    await openWith(sampleConfig());
    render(<GachaApp store={memoryStore()} spinMs={60_000} />);
    await user.click(await screen.findByRole("button", { name: "ガチャを回す" }));
    expect(screen.getByRole("button", { name: "回しています…" })).toBeDisabled();
    expect(screen.queryByText("最近の結果")).not.toBeInTheDocument();
  });

  it("開き直しても結果の履歴が残る", async () => {
    const user = userEvent.setup();
    await openWith(sampleConfig());
    const store = memoryStore();
    const first = render(<GachaApp store={store} spinMs={0} />);
    await user.click(await screen.findByRole("button", { name: "ガチャを回す" }));
    await screen.findByRole("dialog");
    first.unmount();

    render(<GachaApp store={store} spinMs={0} />);
    expect(await screen.findByText("最近の結果")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });

  it("結果画面に受付で見せる案内と現在時刻を出す", async () => {
    const user = userEvent.setup();
    await openWith(sampleConfig());
    render(<GachaApp store={memoryStore()} spinMs={0} />);
    await user.click(await screen.findByRole("button", { name: "ガチャを回す" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("この画面を受付で見せてください。")).toBeInTheDocument();
    expect(within(dialog).getByText("現在時刻")).toBeInTheDocument();
    expect(within(dialog).queryByText(/受け取り済み/)).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "閉じる" }));
    await user.click(screen.getByRole("button", { name: "結果を見る" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
});
