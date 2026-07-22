import { useRef, useState } from 'react'
import { downloadBackupFile, exportDatabaseSnapshot, restoreDatabaseSnapshot } from '../../firebase/api'

function formatExportedAt(iso) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export default function DatabaseBackup() {
  const [exporting, setExporting] = useState(false)
  const [exportStatus, setExportStatus] = useState('idle')

  const [pendingFile, setPendingFile] = useState(null) // { name, snapshot }
  const [parseError, setParseError] = useState(null)
  const [confirmText, setConfirmText] = useState('')
  const [restorePhase, setRestorePhase] = useState('idle') // idle | backing-up | restoring | done | error
  const [restoreError, setRestoreError] = useState(null)
  const fileInputRef = useRef(null)

  const handleExport = async () => {
    setExporting(true)
    setExportStatus('idle')
    try {
      const snapshot = await exportDatabaseSnapshot()
      downloadBackupFile(snapshot)
      setExportStatus('Downloaded.')
    } catch (err) {
      console.error(err)
      setExportStatus('Export failed — see console.')
    } finally {
      setExporting(false)
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setParseError(null)
    setPendingFile(null)
    setConfirmText('')
    setRestorePhase('idle')
    setRestoreError(null)
    try {
      const text = await file.text()
      const snapshot = JSON.parse(text)
      if (!snapshot.exportedAt || !snapshot.collections) {
        throw new Error('This file doesn\'t look like a Fam1 backup (missing exportedAt/collections).')
      }
      setPendingFile({ name: file.name, snapshot })
    } catch (err) {
      setParseError(err.message)
    }
  }

  const handleRestore = async () => {
    if (!pendingFile || confirmText !== 'RESTORE') return
    setRestoreError(null)
    try {
      setRestorePhase('backing-up')
      const safetyBackup = await exportDatabaseSnapshot()
      downloadBackupFile(safetyBackup, 'fam1-backup-pre-restore')

      setRestorePhase('restoring')
      await restoreDatabaseSnapshot(pendingFile.snapshot)

      setRestorePhase('done')
    } catch (err) {
      console.error(err)
      setRestorePhase('error')
      setRestoreError(err.message)
    }
  }

  const resetRestoreFlow = () => {
    setPendingFile(null)
    setParseError(null)
    setConfirmText('')
    setRestorePhase('idle')
    setRestoreError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const restoring = restorePhase === 'backing-up' || restorePhase === 'restoring'

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3 rounded-xl border border-track-700 bg-track-900 p-4">
        <h3 className="font-display text-base font-bold text-slate-100">Export</h3>
        <p className="text-sm text-slate-400">
          Downloads every player, race, driver, prediction, and scoring-settings doc as one JSON file — everything
          needed to fully restore the league later.
        </p>
        <p className="text-xs text-slate-500">
          The file includes hashed passcodes (needed for an accurate restore). They aren't reversible, but still —
          treat the download like any other export of the whole league's data, not something to share casually.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="rounded-lg bg-race-red px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-red-600 disabled:opacity-40"
          >
            {exporting ? 'Exporting…' : 'Download backup'}
          </button>
          {exportStatus !== 'idle' && <span className="text-sm text-slate-400">{exportStatus}</span>}
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-track-700 bg-track-900 p-4">
        <h3 className="font-display text-base font-bold text-slate-100">Restore from backup</h3>
        <p className="text-sm text-slate-400">
          Pick any previously exported file — not just the most recent one. This <strong>overwrites all current
          data</strong> with what's in the file, including any results or scores entered since it was made.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileChange}
          disabled={restoring}
          className="text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-track-700 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-200 hover:file:bg-track-600"
        />

        {parseError && <p className="text-sm text-race-red">{parseError}</p>}

        {pendingFile && restorePhase === 'idle' && (
          <div className="flex flex-col gap-3 rounded-lg border border-race-gold/30 bg-race-gold/10 p-3">
            <p className="text-sm text-race-gold">
              <strong>{pendingFile.name}</strong> is a backup from{' '}
              <strong>{formatExportedAt(pendingFile.snapshot.exportedAt)}</strong>. Restoring will overwrite all
              current data — including any race results or scores entered after that date — with what's in this
              file.
            </p>
            <p className="text-xs text-race-gold/80">
              Your current data will be auto-backed-up and downloaded first, so this is itself recoverable if you
              picked the wrong file.
            </p>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-race-gold/90">
                Type RESTORE to confirm
              </span>
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="RESTORE"
                className="w-40 rounded-lg border border-track-600 bg-track-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-race-red"
              />
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRestore}
                disabled={confirmText !== 'RESTORE'}
                className="rounded-lg bg-race-red px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-red-600 disabled:opacity-40"
              >
                Restore this backup
              </button>
              <button onClick={resetRestoreFlow} className="text-sm text-slate-400 hover:text-slate-200">
                Cancel
              </button>
            </div>
          </div>
        )}

        {restorePhase === 'backing-up' && (
          <p className="text-sm text-race-gold">Backing up current data first (downloading)…</p>
        )}
        {restorePhase === 'restoring' && (
          <p className="text-sm text-race-gold">Restoring — data is locked against new predictions until this finishes…</p>
        )}
        {restorePhase === 'done' && (
          <div className="flex items-center gap-3">
            <p className="text-sm text-race-green">Restore complete.</p>
            <button onClick={resetRestoreFlow} className="text-sm text-slate-400 hover:text-slate-200">
              Restore another file
            </button>
          </div>
        )}
        {restorePhase === 'error' && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-race-red">Restore failed: {restoreError}</p>
            <button onClick={resetRestoreFlow} className="self-start text-sm text-slate-400 hover:text-slate-200">
              Try again
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
