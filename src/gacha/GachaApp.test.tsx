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

  it("保存領域が使えなければ回させない", async () => {
    await openWith(sampleConfig());
    render(<GachaApp store={null} spinMs={0} />);
    expect(await screen.findByText("このブラウザでは回せません")).toBeInTheDocument();
  });

  it("開始前は回せない", async () => {
    const start = new Date(Date.now() + 60 * 60 * 1000);
    await openWith(
      sampleConfig({
        from: start.toISOString(),
        to: new Date(start.getTime() + 60 * 60 * 1000).toISOString(),
      }),
    );
    render(<GachaApp store={memoryStore()} spinMs={0} />);
    expect(await screen.findByText(/開始前です/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ガチャを回す" })).toBeDisabled();
  });

  it("回すと結果が出て、回数を使い切ると回せなくなる", async () => {
    const user = userEvent.setup();
    await openWith(sampleConfig({ daily: 2 }));
    const store = memoryStore();
    render(<GachaApp store={store} spinMs={0} />);

    expect(await screen.findByText(/本日あと/)).toHaveTextContent("本日あと 2 回");
    await user.click(screen.getByRole("button", { name: "ガチャを回す" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("heading").textContent).toMatch(/^(1等|2等)$/);
    await user.click(within(dialog).getByRole("button", { name: /閉じる/ }));
    expect(screen.getByText(/本日あと/)).toHaveTextContent("本日あと 1 回");

    await user.click(screen.getByRole("button", { name: "ガチャを回す" }));
    await user.click(
      within(await screen.findByRole("dialog")).getByRole("button", { name: "閉じる" }),
    );

    expect(screen.getByText(/本日の回数は終了しました/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ガチャを回す" })).toBeDisabled();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("開き直しても回数は戻らない", async () => {
    const user = userEvent.setup();
    await openWith(sampleConfig({ daily: 1 }));
    const store = memoryStore();
    const first = render(<GachaApp store={store} spinMs={0} />);
    await user.click(await screen.findByRole("button", { name: "ガチャを回す" }));
    await screen.findByRole("dialog");
    first.unmount();

    render(<GachaApp store={store} spinMs={0} />);
    expect(await screen.findByText(/本日の回数は終了しました/)).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });

  it("スタッフが受け取り済みにできる", async () => {
    const user = userEvent.setup();
    await openWith(sampleConfig());
    render(<GachaApp store={memoryStore()} spinMs={0} />);
    await user.click(await screen.findByRole("button", { name: "ガチャを回す" }));

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /スタッフ用/ }));
    expect(within(dialog).getByText(/スタッフの方が押してください/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "受け取り済みにする" }));
    expect(within(dialog).getByText("受け取り済み")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /閉じる/ }));
    expect(within(screen.getByRole("list")).getByText("受け取り済み")).toBeInTheDocument();
  });
});
