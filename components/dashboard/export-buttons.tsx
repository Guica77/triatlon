'use client'

import * as React from 'react'
import { Download, Calendar, FileSpreadsheet, Loader2 } from 'lucide-react'
import { exportWorkoutsCSV, exportCalendarICS } from '@/lib/export-utils'

export function ExportButtons() {
  const [loading, setLoading] = React.useState<'csv' | 'ics' | null>(null)

  const handleCSV = async () => {
    setLoading('csv')
    try {
      const { csv, filename } = await exportWorkoutsCSV()
      if (!csv) {
        alert('No hay entrenamientos para exportar.')
        return
      }
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(null)
    }
  }

  const handleICS = async () => {
    setLoading('ics')
    try {
      const { ics, filename } = await exportCalendarICS()
      if (!ics) {
        alert('No hay entrenamientos para exportar.')
        return
      }
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleCSV}
        disabled={loading !== null}
        className="flex min-h-10 items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary bg-surface-card hover:bg-surface-hover border border-border-subtle hover:border-border-default transition-[background-color,color,border-color,opacity,box-shadow,transform] duration-150 ease-out active:scale-[0.97] disabled:opacity-50 motion-reduce:transition-opacity motion-reduce:active:scale-100"
      >
        {loading === 'csv' ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-3.5 h-3.5" />
        )}
        Exportar CSV
      </button>
      <button
        onClick={handleICS}
        disabled={loading !== null}
        className="flex min-h-10 items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary bg-surface-card hover:bg-surface-hover border border-border-subtle hover:border-border-default transition-[background-color,color,border-color,opacity,box-shadow,transform] duration-150 ease-out active:scale-[0.97] disabled:opacity-50 motion-reduce:transition-opacity motion-reduce:active:scale-100"
      >
        {loading === 'ics' ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Calendar className="w-3.5 h-3.5" />
        )}
        Calendario ICS
      </button>
    </div>
  )
}