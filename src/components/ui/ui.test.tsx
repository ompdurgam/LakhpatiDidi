import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Button } from "./Button"
import { Card } from "./Card"
import { Drawer } from "./Drawer"
import { Icon } from "./Icon"
import { ProgressBar } from "./ProgressBar"
import { StatusBadge } from "./StatusBadge"
import { Table } from "./Table"
import { Timeline } from "./Timeline"
import { YesNo } from "./YesNo"

describe("ui components", () => {
  it("StatusBadge picks the tone from the status label", () => {
    render(
      <>
        <StatusBadge label="अतिदेय" />
        <StatusBadge label="स्वीकृत" />
        <StatusBadge label="unknown" />
        <StatusBadge label="custom" tone="amber" />
      </>,
    )
    expect(screen.getByText("अतिदेय")).toHaveClass("status", "red")
    expect(screen.getByText("स्वीकृत")).toHaveClass("green")
    expect(screen.getByText("unknown")).toHaveClass("blue")
    expect(screen.getByText("custom")).toHaveClass("amber")
  })

  it("ProgressBar clamps to 0–100", () => {
    const { rerender } = render(<ProgressBar value={150} label="p" />)
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100")
    rerender(<ProgressBar value={-5} label="p" />)
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0")
  })

  it("Icon renders an svg sized as requested", () => {
    const { container } = render(<Icon name="home" size={24} />)
    expect(container.querySelector("svg")!.getAttribute("width")).toBe("24")
  })

  it("Button applies the variant class and icon", () => {
    render(
      <Button variant="primary" icon="plus">
        जोड़ें
      </Button>,
    )
    const button = screen.getByRole("button", { name: "जोड़ें" })
    expect(button).toHaveClass("primary")
    expect(button.querySelector("svg")).not.toBeNull()
  })

  it("Card renders title, subtitle and action", () => {
    render(<Card title="शीर्षक" subtitle="उप" action={<button>a</button>} />)
    expect(screen.getByRole("heading", { name: "शीर्षक" })).toBeInTheDocument()
    expect(screen.getByText("उप")).toBeInTheDocument()
  })

  it("Table shows rows and an empty state", () => {
    const columns = [{ key: "n", header: "नाम", render: (r: { n: string }) => r.n }]
    const { rerender } = render(
      <Table columns={columns} rows={[{ n: "सीता" }]} rowKey={(r) => r.n} empty="खाली" />,
    )
    expect(screen.getByText("सीता")).toBeInTheDocument()
    rerender(<Table columns={columns} rows={[]} rowKey={(r) => r.n} empty="खाली" />)
    expect(screen.getByText("खाली")).toBeInTheDocument()
  })

  it("Timeline marks done steps with a check", () => {
    const { container } = render(
      <Timeline
        steps={[
          { label: "DPR जमा", date: "1", state: "done" },
          { label: "स्वीकृत", date: "लंबित", state: "active" },
        ]}
      />,
    )
    expect(container.querySelectorAll(".done svg")).toHaveLength(1)
    expect(container.querySelector(".active")).toHaveTextContent("स्वीकृत")
  })

  it("Drawer closes on Escape and on the close button", async () => {
    const onClose = vi.fn()
    render(
      <Drawer title="APP-1" onClose={onClose}>
        body
      </Drawer>,
    )
    await userEvent.keyboard("{Escape}")
    await userEvent.click(screen.getByRole("button", { name: "बंद करें" }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it("YesNo reports the chosen value", async () => {
    const onChange = vi.fn()
    render(<YesNo value={undefined} onChange={onChange} />)
    await userEvent.click(screen.getByText("हाँ"))
    expect(onChange).toHaveBeenCalledWith(true)
  })
})
