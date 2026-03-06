import re

with open('src/RutaVerde.jsx', 'r') as f:
    content = f.read()

# regex for JSX tags (simplified)
tags = re.findall(r'<[a-zA-Z0-9]+[^>]*>', content, re.DOTALL)
for tag in tags:
    # Match attribute names followed by ={
    attrs = re.findall(r'\s([a-zA-Z0-9]+)=\{', tag)
    # Also match attribute names followed by =" or ='
    attrs += re.findall(r'\s([a-zA-Z0-9]+)=["\']', tag)

    if len(attrs) != len(set(attrs)):
        dups = [a for a in set(attrs) if attrs.count(a) > 1]
        print(f"Found duplicate attributes {dups} in tag: {tag[:100]}...")
