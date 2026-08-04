"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Info, Wallet } from "lucide-react";

import {
  AppPage,
  EmptyState,
  PageHeader,
  StatCard,
} from "@/components/daisy";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney, type Payment } from "@/domain";
import { seedPayments, seedWorkOrders } from "@/server/mocks/seed";

type Row = {
  payment: Payment;
  title: string;
  counterparty: string;
};

export default function PaymentsPage() {
  const [tab, setTab] = useState("all");
  const [selected, setSelected] = useState<Row | null>(null);

  const rows = useMemo(() => {
    return seedPayments.map((p) => {
      const wo = seedWorkOrders.find((w) => w.id === p.workOrderId);
      return {
        payment: p,
        title: wo?.title ?? "Work Order",
        counterparty: "Northline Retail",
      };
    });
  }, []);

  const filtered = rows.filter((r) => {
    if (tab === "all") return true;
    return r.payment.status === tab;
  });

  const available = rows
    .filter((r) => r.payment.status === "released")
    .reduce((sum, r) => sum + r.payment.amount, 0);
  const pending = rows
    .filter((r) => r.payment.status === "authorized")
    .reduce((sum, r) => sum + r.payment.amount, 0);
  const upcoming = rows
    .filter((r) => r.payment.status === "unauthorized")
    .reduce((sum, r) => sum + r.payment.amount, 0);

  return (
    <AppPage width="dense">
      <PageHeader
        title="Payments"
        description="Authorized and released amounts for your work."
      />

      <Alert>
        <Info className="size-4" />
        <AlertTitle>Mock payments</AlertTitle>
        <AlertDescription>
          These amounts come from the demo store. No real money moves in this
          build.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatCard
          label="Available"
          value={formatMoney(available)}
          hint="Released"
        />
        <StatCard
          label="Pending"
          value={formatMoney(pending)}
          hint="Authorized"
        />
        <StatCard
          label="Upcoming"
          value={formatMoney(upcoming)}
          hint="Not authorized"
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="overflow-x-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="authorized">Authorized</TabsTrigger>
          <TabsTrigger value="released">Released</TabsTrigger>
          <TabsTrigger value="unauthorized">Upcoming</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <EmptyState
          title="No payments"
          description="Authorized escrow and releases will show here."
          icon={Wallet}
          action={
            <Button asChild variant="outline">
              <Link href="/work">Browse work</Link>
            </Button>
          }
        />
      ) : (
        <>
          <ul className="space-y-2 md:hidden">
            {filtered.map((row) => (
              <li key={row.payment.id}>
                <button
                  type="button"
                  onClick={() => setSelected(row)}
                  className="flex w-full min-w-0 items-start justify-between gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-sm outline-none transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-semibold">{row.title}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="capitalize">
                        {row.payment.status.replaceAll("_", " ")}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {row.counterparty}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {row.payment.authorizedAt
                        ? row.payment.authorizedAt.toLocaleDateString()
                        : "Pending date"}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatMoney(row.payment.amount, row.payment.currency)}
                  </p>
                </button>
              </li>
            ))}
          </ul>

          <div className="hidden min-w-0 overflow-x-auto rounded-xl border border-border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Work</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Counterparty</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow
                    key={row.payment.id}
                    className="cursor-pointer"
                    onClick={() => setSelected(row)}
                  >
                    <TableCell className="max-w-xs truncate font-medium">
                      {row.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {row.payment.status.replaceAll("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.counterparty}</TableCell>
                    <TableCell className="tabular-nums">
                      {row.payment.authorizedAt
                        ? row.payment.authorizedAt.toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatMoney(row.payment.amount, row.payment.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <Drawer
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-left break-words">
              {selected?.title ?? "Payment"}
            </DrawerTitle>
          </DrawerHeader>
          {selected ? (
            <div className="space-y-3 px-4 pb-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold tabular-nums">
                  {formatMoney(
                    selected.payment.amount,
                    selected.payment.currency,
                  )}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="secondary" className="capitalize">
                  {selected.payment.status.replaceAll("_", " ")}
                </Badge>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Counterparty</span>
                <span>{selected.counterparty}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Authorized</span>
                <span className="tabular-nums">
                  {selected.payment.authorizedAt
                    ? selected.payment.authorizedAt.toLocaleString()
                    : "—"}
                </span>
              </div>
            </div>
          ) : null}
          <DrawerFooter>
            <Button asChild>
              <Link href={`/work/${selected?.payment.workOrderId ?? ""}`}>
                Open Work Order
              </Link>
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </AppPage>
  );
}
