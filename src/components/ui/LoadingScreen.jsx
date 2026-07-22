import Fam1Logo from './Fam1Logo'

export default function LoadingScreen({ message = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <Fam1Logo variant="mark" className="h-10 w-10 animate-pulse" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  )
}
