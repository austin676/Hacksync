"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, Loader2, Plus, CheckCircle2 } from "lucide-react"

interface CreateTransactionDialogProps {
  onSuccess?: () => void
}

export function CreateTransactionDialog({ onSuccess }: CreateTransactionDialogProps) {
  const { token } = useAuth()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [fraudWarning, setFraudWarning] = useState<string[] | null>(null)

  const [formData, setFormData] = useState({
    amount: "",
    recipient: "",
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFraudWarning(null)
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number.parseFloat(formData.amount),
          recipient: formData.recipient,
          description: formData.description,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.flags) {
          setFraudWarning(data.flags)
        }
        throw new Error(data.error || "Failed to create transaction")
      }

      if (data.fraudCheck?.flags?.length > 0) {
        setFraudWarning(data.fraudCheck.flags)
      }

      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        setFormData({ amount: "", recipient: "", description: "" })
        onSuccess?.()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setError(null)
      setFraudWarning(null)
      setSuccess(false)
      setFormData({ amount: "", recipient: "", description: "" })
    }
    setOpen(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Transaction</DialogTitle>
          <DialogDescription>
            Submit a new transaction for approval. Transactions are reviewed by administrators before execution.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <CheckCircle2 className="h-12 w-12 text-success" />
            <div className="text-center">
              <p className="font-medium text-foreground">Transaction Submitted</p>
              <p className="text-sm text-muted-foreground">Awaiting admin approval</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="recipient">Recipient Address</Label>
                <Input
                  id="recipient"
                  placeholder="0x..."
                  value={formData.recipient}
                  onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                  className="font-mono text-sm"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Transaction purpose..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <span className="text-sm text-destructive">{error}</span>
                </div>
              )}

              {fraudWarning && (
                <div className="flex items-start gap-2 rounded-lg border border-warning/50 bg-warning/10 p-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  <div className="text-sm text-warning">
                    <p className="font-medium">Security Warning:</p>
                    <ul className="mt-1 list-inside list-disc">
                      {fraudWarning.map((flag, i) => (
                        <li key={i}>{flag}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Transaction"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
