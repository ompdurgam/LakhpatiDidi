import { useState } from "react"

import { Icon } from "@/components/ui/Icon"

export function CostTable() {
  const [rows, setRows] = useState([
    { item: "तालाब तैयारी", quantity: "1", amount: 30000 },
    { item: "फिंगरलिंग बीज", quantity: "5,000", amount: 25000 },
    { item: "मछली आहार", quantity: "12 माह", amount: 40000 },
    { item: "जाल और उपकरण", quantity: "1 सेट", amount: 25000 },
  ])
  const total = rows.reduce((sum, row) => sum + row.amount, 0)
  const subsidy = Math.round(total * 0.6)
  const bank = Math.round(total * 0.3)
  const own = total - subsidy - bank
  const updateRow = (index: number, patch: Partial<(typeof rows)[number]>) =>
    setRows(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)))
  return (
    <div className="cost-finance-layout">
      <div className="cost-table editable">
        <div className="cost-row head">
          <span>लागत मद</span>
          <span>मात्रा</span>
          <span>राशि</span>
        </div>
        {rows.map((row, index) => (
          <div className="cost-row" key={`${row.item}-${index}`}>
            <input
              value={row.item}
              onChange={(event) => updateRow(index, { item: event.target.value })}
            />
            <input
              value={row.quantity}
              onChange={(event) => updateRow(index, { quantity: event.target.value })}
            />
            <input
              type="number"
              value={row.amount}
              onChange={(event) => updateRow(index, { amount: Number(event.target.value) })}
            />
          </div>
        ))}
        <button
          className="add-cost-item"
          onClick={() => setRows([...rows, { item: "नई लागत मद", quantity: "1", amount: 0 }])}
        >
          <Icon name="plus" size={14} /> मद जोड़ें
        </button>
        <div className="cost-total">
          <span>कुल परियोजना लागत</span>
          <strong>₹{total.toLocaleString("en-IN")}</strong>
        </div>
        <div className="finance-chips">
          <span>सब्सिडी 60% • ₹{subsidy.toLocaleString("en-IN")}</span>
          <span>बैंक ऋण • ₹{bank.toLocaleString("en-IN")}</span>
          <span>स्वयं अंश • ₹{own.toLocaleString("en-IN")}</span>
        </div>
      </div>
      <div className="finance-donut-card">
        <h4>वित्त के साधन</h4>
        <div className="finance-donut">
          <span>
            ₹{total.toLocaleString("en-IN")}
            <small>कुल</small>
          </span>
        </div>
        <div className="finance-legend">
          <p>
            <i className="subsidy" />
            <span>सब्सिडी 60%</span>
            <strong>₹{subsidy.toLocaleString("en-IN")}</strong>
          </p>
          <p>
            <i className="bank" />
            <span>बैंक ऋण 30%</span>
            <strong>₹{bank.toLocaleString("en-IN")}</strong>
          </p>
          <p>
            <i className="own" />
            <span>स्वयं अंश 10%</span>
            <strong>₹{own.toLocaleString("en-IN")}</strong>
          </p>
        </div>
      </div>
    </div>
  )
}
