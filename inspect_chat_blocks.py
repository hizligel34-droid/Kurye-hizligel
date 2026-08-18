from pathlib import Path
text = Path('client/src/pages/Home.tsx').read_text()
out = []
for needle in ['liveMessages.data', 'panelMessages.data']:
    idx = text.find(needle)
    out.append(f'--- {needle} at {idx} ---\n{text[max(0, idx-1200):idx+2600]}\n')
Path('chat_blocks_excerpt.txt').write_text('\n'.join(out))

print('--- imports ---')
print(text[:1800])
print('--- state area ---')
idx = text.find('const [liveMessage')
print(text[idx:idx+2600])
