"use client"

import { Download } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { type ColumnKey, downloadCsv, EXPORT_COLUMNS, generateCsv } from "@/lib/csv-export"
import type { Podcast } from "@/lib/types"

type Props = {
  podcasts: Podcast[]
}

export function CsvExportDialog({ podcasts }: Props) {
  const [selectedColumns, setSelectedColumns] = useState<ColumnKey[]>(
    EXPORT_COLUMNS.filter((col) => col.defaultEnabled).map((col) => col.key)
  )
  const [open, setOpen] = useState(false)

  const handleToggle = (key: ColumnKey, checked: boolean) => {
    setSelectedColumns((prev) => (checked ? [...prev, key] : prev.filter((k) => k !== key)))
  }

  const handleSelectAll = () => setSelectedColumns(EXPORT_COLUMNS.map((col) => col.key))
  const handleDeselectAll = () => setSelectedColumns([])

  const handleExport = () => {
    const csv = generateCsv(podcasts, selectedColumns)
    const date = new Date().toISOString().slice(0, 10)
    downloadCsv(csv, `podcasts-${date}.csv`)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" title="CSVエクスポート" aria-label="CSVエクスポート">
          <Download className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>CSVエクスポート</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleSelectAll}>
              すべて選択
            </Button>
            <Button size="sm" variant="outline" onClick={handleDeselectAll}>
              すべて解除
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {EXPORT_COLUMNS.map((col) => (
              <div key={col.key} className="flex items-center gap-2">
                <Checkbox
                  id={col.key}
                  checked={selectedColumns.includes(col.key)}
                  onCheckedChange={(checked) => handleToggle(col.key, !!checked)}
                />
                <Label htmlFor={col.key} className="cursor-pointer">
                  {col.label}
                </Label>
              </div>
            ))}
          </div>

          <p className="text-sm text-muted-foreground">対象: {podcasts.length}件</p>
        </div>

        <DialogFooter>
          <Button onClick={handleExport} disabled={selectedColumns.length === 0}>
            <Download className="size-4 mr-2" />
            エクスポート
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
