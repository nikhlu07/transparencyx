"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { name: "Jan", mainGov: 100000, stateHead: 80000, deputy: 0, vendor: 0 },
  { name: "Feb", mainGov: 150000, stateHead: 120000, deputy: 90000, vendor: 0 },
  { name: "Mar", mainGov: 200000, stateHead: 180000, deputy: 150000, vendor: 100000 },
  { name: "Apr", mainGov: 250000, stateHead: 220000, deputy: 190000, vendor: 150000 },
  { name: "May", mainGov: 300000, stateHead: 270000, deputy: 240000, vendor: 200000 },
  { name: "Jun", mainGov: 350000, stateHead: 320000, deputy: 290000, vendor: 250000 },
]

export function TransactionTrailChart() {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Transaction Trail</CardTitle>
        <CardDescription>Budget flow through the system</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, ""]} />
              <Area
                type="monotone"
                dataKey="mainGov"
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
                name="Main Government"
              />
              <Area type="monotone" dataKey="stateHead" stackId="2" stroke="#3b82f6" fill="#3b82f6" name="State Head" />
              <Area type="monotone" dataKey="deputy" stackId="3" stroke="#f59e0b" fill="#f59e0b" name="Deputy" />
              <Area type="monotone" dataKey="vendor" stackId="4" stroke="#8b5cf6" fill="#8b5cf6" name="Vendor" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
