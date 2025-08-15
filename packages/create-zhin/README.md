# create-zhin

快速创建Zhin Bot项目的工具包。

## 使用

```bash
# npm
npm create zhin my-bot

# yarn
yarn create zhin my-bot

# pnpm
pnpm create zhin my-bot
```

这个包是`@zhin.js/cli`的一个便捷包装器，它会自动调用`zhin init`命令来创建新项目。所有传递给`create-zhin`的参数都会被转发给`zhin init`命令。

## 选项

所有`zhin init`命令支持的选项都可以使用：

```bash
npm create zhin my-bot -- -c ts -p pnpm -r bun
```

- `-c, --config <format>`: 配置文件格式 (json|yaml|toml|ts|js)
- `-p, --package-manager <manager>`: 包管理器 (npm|yarn|pnpm)
- `-r, --runtime <runtime>`: 运行时 (node|bun)
- `-y, --yes`: 使用默认选项

## 许可证

MIT License