"use client"

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, UserMinus } from "lucide-react";
import { getClearGovContract, clearGovConfig } from "@/app/lib/contractConfig";
import { ethers } from "ethers";

interface Role {
  address: string;
  status: string;
  proposedAt: string;
  confirmedAt: string;
  stateHead?: string;
}

export function RoleManagement() {
  const [openStateHead, setOpenStateHead] = useState(false);
  const [openDeputy, setOpenDeputy] = useState(false);
  const [stateHeadAddress, setStateHeadAddress] = useState("");
  const [deputyAddress, setDeputyAddress] = useState("");
  const [stateHeads, setStateHeads] = useState<Role[]>([]);
  const [deputies, setDeputies] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = async () => {
    try {
      const contract = await getClearGovContract();
      const provider = new ethers.JsonRpcProvider(clearGovConfig.rpcUrl);
      const latestBlock = await provider.getBlockNumber();

      // Fetch state heads
      const stateHeadFilter = contract.filters.StateHeadProposed();
      const stateHeadTopics = (stateHeadFilter as any).topics as string[] || [];
      const stateHeadEvents = await contract.queryFilter(stateHeadTopics, 0, latestBlock);
      const stateHeadsData = stateHeadEvents.map((log) => {
        const decoded = contract.interface.parseLog(log);
        if (!decoded) return null;
        
        return {
          address: decoded.args[0],
          status: "Proposed",
          proposedAt: `Block #${log.blockNumber || 'unknown'}`,
          confirmedAt: "-",
        };
      }).filter(Boolean) as Role[];
      
      // Fetch deputies
      const deputyFilter = contract.filters.DeputyProposed();
      const deputyTopics = (deputyFilter as any).topics as string[] || [];
      const deputyEvents = await contract.queryFilter(deputyTopics, 0, latestBlock);
      const deputiesData = deputyEvents.map((log) => {
        const decoded = contract.interface.parseLog(log);
        if (!decoded) return null;
        
        return {
          address: decoded.args[1],
          status: "Proposed",
          proposedAt: `Block #${log.blockNumber || 'unknown'}`,
          confirmedAt: "-",
          stateHead: decoded.args[0],
        };
      }).filter(Boolean) as Role[];
      
      setStateHeads(stateHeadsData);
      setDeputies(deputiesData);
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleProposeStateHead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stateHeadAddress || !ethers.isAddress(stateHeadAddress)) {
      console.error("Invalid address format");
      return;
    }
    
    try {
      const contract = await getClearGovContract();
      const tx = await contract.proposeStateHead(stateHeadAddress, { gasLimit: 1000000 });
      await tx.wait();
      console.log("State head proposed with tx:", tx.hash);
      setOpenStateHead(false);
      setStateHeadAddress("");
      await fetchRoles();
    } catch (error) {
      console.error("Error proposing state head:", error);
    }
  };

  const handleProposeDeputy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deputyAddress || !ethers.isAddress(deputyAddress)) {
      console.error("Invalid address format");
      return;
    }
    
    try {
      const contract = await getClearGovContract();
      const tx = await contract.proposeDeputy(deputyAddress, { gasLimit: 1000000 });
      await tx.wait();
      console.log("Deputy proposed with tx:", tx.hash);
      setOpenDeputy(false);
      setDeputyAddress("");
      await fetchRoles();
    } catch (error) {
      console.error("Error proposing deputy:", error);
    }
  };

  if (loading) return <div>Loading roles...</div>;
  return (
    <div className="space-y-4">
      <Tabs defaultValue="state-heads" className="space-y-4">
        <TabsList>
          <TabsTrigger value="state-heads">State Heads</TabsTrigger>
          <TabsTrigger value="deputies">Deputies</TabsTrigger>
        </TabsList>

        <TabsContent value="state-heads" className="space-y-4">
          <div className="flex justify-between">
            <h2 className="text-xl font-bold">State Heads Management</h2>
            <Dialog open={openStateHead} onOpenChange={setOpenStateHead}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="mr-2 h-4 w-4" /> Propose State Head
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleProposeStateHead}>
                  <DialogHeader>
                    <DialogTitle>Propose State Head</DialogTitle>
                    <DialogDescription>Propose a new state head to manage budget allocations.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="state-head-address">Wallet Address</Label>
                      <Input
                        id="state-head-address"
                        placeholder="0x..."
                        value={stateHeadAddress}
                        onChange={(e) => setStateHeadAddress(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                      Propose
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Active State Heads</CardTitle>
              <CardDescription>View and manage state heads who can allocate budgets.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Proposed At</TableHead>
                    <TableHead>Confirmed At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stateHeads.length > 0 ? (
                    stateHeads.map((role) => (
                      <TableRow key={role.address}>
                        <TableCell className="font-mono">{role.address}</TableCell>
                        <TableCell>
                          <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                            {role.status}
                          </span>
                        </TableCell>
                        <TableCell>{role.proposedAt}</TableCell>
                        <TableCell>{role.confirmedAt}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" className="text-red-500">
                            <UserMinus className="mr-2 h-4 w-4" /> Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                        No state heads found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deputies" className="space-y-4">
          <div className="flex justify-between">
            <h2 className="text-xl font-bold">Deputies Management</h2>
            <Dialog open={openDeputy} onOpenChange={setOpenDeputy}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="mr-2 h-4 w-4" /> Propose Deputy
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleProposeDeputy}>
                  <DialogHeader>
                    <DialogTitle>Propose Deputy</DialogTitle>
                    <DialogDescription>Propose a new deputy to manage vendor selection.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="deputy-address">Wallet Address</Label>
                      <Input
                        id="deputy-address"
                        placeholder="0x..."
                        value={deputyAddress}
                        onChange={(e) => setDeputyAddress(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                      Propose
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Active Deputies</CardTitle>
              <CardDescription>View and manage deputies who can select vendors.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Address</TableHead>
                    <TableHead>State Head</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Proposed At</TableHead>
                    <TableHead>Confirmed At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deputies.length > 0 ? (
                    deputies.map((role) => (
                      <TableRow key={role.address}>
                        <TableCell className="font-mono">{role.address}</TableCell>
                        <TableCell className="font-mono">{role.stateHead}</TableCell>
                        <TableCell>
                          <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                            {role.status}
                          </span>
                        </TableCell>
                        <TableCell>{role.proposedAt}</TableCell>
                        <TableCell>{role.confirmedAt}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" className="text-red-500">
                            <UserMinus className="mr-2 h-4 w-4" /> Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                        No deputies found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}