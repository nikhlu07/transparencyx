import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const challenges = [
  {
    id: 1,
    invoiceHash: "0xabc...123",
    staker: "0xcdef...4567",
    amount: "1 PYUSD",
    claimId: 4,
    status: "pending",
    timestamp: "1 day ago",
  },
  {
    id: 2,
    invoiceHash: "0xdef...456",
    staker: "0xefgh...8901",
    amount: "1 PYUSD",
    claimId: 7,
    status: "verified",
    timestamp: "2 days ago",
  },
  {
    id: 3,
    invoiceHash: "0xghi...789",
    staker: "0xijkl...2345",
    amount: "1 PYUSD",
    claimId: 9,
    status: "rejected",
    timestamp: "3 days ago",
  },
]

export function ActiveChallenges() {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Active Challenges</CardTitle>
        <CardDescription>Public challenges to claims</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Claim ID</TableHead>
              <TableHead>Staker</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {challenges.map((challenge) => (
              <TableRow key={challenge.id}>
                <TableCell>#{challenge.claimId}</TableCell>
                <TableCell className="font-mono text-xs">{challenge.staker}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      challenge.status === "verified"
                        ? "success"
                        : challenge.status === "rejected"
                          ? "destructive"
                          : "outline"
                    }
                  >
                    {challenge.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
