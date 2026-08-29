import sys, os

if len(sys.argv) < 2:
    print('Usage: python write_file.py path')
    sys.exit(1)

path = sys.argv[1]
content = sys.stdin.read()

dir_name = os.path.dirname(path)
if dir_name:
    os.makedirs(dir_name, exist_ok=True)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f'File created: {path}')
