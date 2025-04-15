import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const alerts = [
  {
    id: 1,
    title: "Suspicious Invoice Pattern",
    description: "Multiple similar invoices submitted by Vendor 0x5678...9012",
    severity: "high",
    timestamp: "2 hours ago",
  },
  {
    id: 2,
    title: "Unusual Payment Amount",
    description: "Payment to supplier significantly higher than average",
    severity: "medium",
    timestamp: "5 hours ago",
  },
  {
    id: 3,
    title: "Rapid Succession Claims",
    description: "Multiple claims submitted within minutes by same vendor",
    severity: "medium",
    timestamp: "1 day ago",
  },
]

export function FraudAlerts() {
  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Fraud Alerts</CardTitle>
          <CardDescription>Potential fraudulent activities</CardDescription>
        </div>
        <AlertTriangle className="h-5 w-5 text-amber-500" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={alert.severity === "high" ? "destructive" : "outline"}>
                    {alert.severity.toUpperCase()}
                  </Badge>
                  <h4 className="font-semibold">{alert.title}</h4>
                </div>
                <span className="text-xs text-muted-foreground">{alert.timestamp}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{alert.description}</p>
              <div className="mt-3 flex justify-end">
                <Button variant="outline" size="sm">
                  Investigate
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
