import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const recentActivities = [
  {
    id: 1,
    action: "Budget Locked",
    user: "0x1234...5678",
    role: "Main Government",
    details: "$250,000 for Education Q1 2025",
    timestamp: "2 hours ago",
  },
  {
    id: 2,
    action: "Claim Submitted",
    user: "0x5678...9012",
    role: "Vendor",
    details: "$50,000 for Elementary Schools Supplies",
    timestamp: "3 hours ago",
  },
  {
    id: 3,
    action: "Vendor Selected",
    user: "0x3456...7890",
    role: "Deputy",
    details: "Vendor 0x5678...9012 for Road Repairs",
    timestamp: "5 hours ago",
  },
  {
    id: 4,
    action: "Claim Approved",
    user: "0x1234...5678",
    role: "Main Government",
    details: "Claim #3 for $100,000",
    timestamp: "6 hours ago",
  },
  {
    id: 5,
    action: "Budget Allocated",
    user: "0x2345...6789",
    role: "State Head",
    details: "$75,000 for High Schools",
    timestamp: "8 hours ago",
  },
]

export function RecentActivityTable() {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest actions on the platform</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentActivities.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell>
                  <Badge variant="outline">{activity.action}</Badge>
                </TableCell>
                <TableCell className="font-mono">{activity.user}</TableCell>
                <TableCell>{activity.role}</TableCell>
                <TableCell>{activity.details}</TableCell>
                <TableCell>{activity.timestamp}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
