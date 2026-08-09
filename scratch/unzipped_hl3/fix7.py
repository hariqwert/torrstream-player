import re

with open('consumet.html', 'r') as f:
    html = f.read()

def replacer(match):
    return r'onclick="openEpgProgramDetails({title: \'${prog.title.replace(/\'/g, "\\\'")}\', start: new Date(\'${prog.start}\'), end: new Date(\'${prog.end}\'), desc: \'${(prog.desc || "").replace(/\'/g, "\\\'")}\', category: \'${(prog.category || "").replace(/\'/g, "\\\'")}\'}, \'${channelName.replace(/\'/g, "\\\'")}\', (typeof channelUrl !== \'undefined\' ? channelUrl : null))"'

html = re.sub(r'onclick="openEpgProgramDetails\(\{title:[^"]+\)"', replacer, html)

with open('consumet.html', 'w') as f:
    f.write(html)
print("done")
