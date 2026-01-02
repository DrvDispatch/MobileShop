import os

def print_tree(startpath, exclude_dirs=None, exclude_files=None, allowed_exts=None, max_depth=4):
    if exclude_dirs is None:
        exclude_dirs = {'.git', 'node_modules', '.next', '.turbo', 'dist', 'build', 'public', 'assets', 'migrations', 'generated', '.vercel', '.idea', '.vscode'}
    if exclude_files is None:
        exclude_files = {'package-lock.json', 'tsconfig.json', '.env', 'README.md', 'next-env.d.ts', '.gitignore', 'next.config.js', 'next.config.ts', 'postcss.config.js', 'tailwind.config.ts'}
    if allowed_exts is None:
        allowed_exts = {'.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.prisma', '.html'}

    output = []
    
    def walk(path, prefix='', depth=0):
        if depth > max_depth:
            return
        
        try:
            items = sorted(os.listdir(path))
        except PermissionError:
            return

        # Filter items
        filtered_items = []
        for item in items:
            full_path = os.path.join(path, item)
            is_dir = os.path.isdir(full_path)
            
            if is_dir:
                if item in exclude_dirs:
                    continue
                # Add check for specific subpaths if needed, but for now item name is enough
                filtered_items.append(item)
            else:
                ext = os.path.splitext(item)[1].lower()
                if item in exclude_files:
                    continue
                if ext in allowed_exts:
                    filtered_items.append(item)

        for i, item in enumerate(filtered_items):
            full_path = os.path.join(path, item)
            is_last = (i == len(filtered_items) - 1)
            connector = '└── ' if is_last else '├── '
            
            output.append(f"{prefix}{connector}{item}")
            
            if os.path.isdir(full_path):
                new_prefix = prefix + ('    ' if is_last else '│   ')
                walk(full_path, new_prefix, depth + 1)

    output.append(os.path.basename(startpath))
    walk(startpath)
    return "\n".join(output)

if __name__ == "__main__":
    targets = ['frontend', 'backend', 'owner-app']
    root_dir = os.getcwd()
    
    with open('hierarchy.md', 'w', encoding='utf-8') as f:
        f.write("# Project Hierarchy\n\n")
        for target in targets:
            target_path = os.path.join(root_dir, target)
            if os.path.exists(target_path):
                f.write(f"## {target.capitalize()}\n")
                f.write("```text\n")
                f.write(print_tree(target_path))
                f.write("\n```\n\n")
    
    print("Hierarchy saved to hierarchy.md")
