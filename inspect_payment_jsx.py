from pathlib import Path
s=Path("client/src/pages/Home.tsx").read_text()
start=s.index('<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">')
end=s.index('<Card className="h-fit', start)
print(s[start:end])
