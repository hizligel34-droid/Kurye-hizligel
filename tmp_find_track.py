from pathlib import Path
s = Path('client/src/pages/Home.tsx').read_text()
needle = 'section === "track"'
i = s.find(needle)
print(i)
print(s[i-120:i+2600] if i >= 0 else 'not found')
