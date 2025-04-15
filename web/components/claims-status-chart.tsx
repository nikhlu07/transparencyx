"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

const data = [
  { name: "Approved", value: 45, color: "#10b981" },
  { name: "Pending", value: 30, color: "#f59e0b" },
  { name: "Flagged", value: 15, color: "#ef4444" },
  { name: "Paid", value: 60, color: "#3b82f6" },
]

export function ClaimsStatusChart() {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Claims Status</CardTitle>
        <CardDescription>Distribution of claims by status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} claims`, "Count"]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
