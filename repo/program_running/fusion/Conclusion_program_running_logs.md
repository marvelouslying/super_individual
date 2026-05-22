```
# Conduit 全栈项目从零搭建与问题迭代日志

> **项目名称**：RealWorld Conduit 示例应用  
> **仓库地址**：https://github.com/TonyMckes/conduit-realworld-example-app  
> **本地路径**：`D:\bytedance_project\conduit-realworld-example-app`  
> **记录时间**：2026年5月21日  
> **环境信息**：  
> - Git 2.45.1  
> - VS Code 1.117  
> - Node.js v20.18.0 → 后升级至最新版（但问题依旧）  
> - npm 10.8.2 → 11.12.1  
> - MySQL Server 9.3  

---

## 一、项目克隆与初始依赖安装

### 1.1 克隆仓库
```bash
git clone https://github.com/TonyMckes/conduit-realworld-example-app.git
cd conduit-realworld-example-app
```



### 1.2 安装根依赖

bash

```
npm install
```



**输出日志**：

- `added 296 packages`
- 出现 `EBADENGINE` 警告：`@vitejs/plugin-react-swc@4.2.3` 和 `vite@7.3.1` 要求 Node.js `^20.19.0 || >=22.12.0`，当前 `v20.18.0`
- 另有 `glob@10.5.0` 弃用警告及 8 个安全漏洞。

**思考与决策**：
版本警告暂时不处理，优先保证项目运行。漏洞建议 `npm audit fix` 暂缓。

------

## 二、环境配置与数据库初始化

### 2.1 创建 `.env` 文件并填充变量

根据 `backend/.env.example`，在项目根目录创建 `.env` 并填入：

text

```
PORT=3001
JWT_KEY=test_secret_key
DEV_DB_USERNAME=root
DEV_DB_PASSWORD=123456
DEV_DB_NAME=conduit_dev
DEV_DB_HOSTNAME=127.0.0.1
DEV_DB_DIALECT=mysql
DEV_DB_LOGGING=true
...（测试、生产同理）
```



### 2.2 安装 MySQL 驱动

bash

```
npm install -w backend mysql2
```



输出正常，无错误。

### 2.3 创建数据库 —— 遇到 `Dialect undefined` 错误

bash

```
npm run sqlz -- db:create
```



**报错**：

text

```
ERROR: Dialect undefined does not support db:create / db:drop commands
```



日志中 `[dotenv@17.3.1] injecting env (0) from .env` 表示加载了 0 个环境变量。

**分析思路**：

- `dotenv` 默认加载当前工作目录下的 `.env` 文件。
- 命令 `npm run sqlz` 实际执行 `npx -w backend sequelize-cli`，其中 `-w backend` 是 npm workspace 参数，会切换当前工作目录到 `backend`。
- 因此 `.env` 文件需要放在 `backend` 目录下，而非根目录。

**验证实验**：
在根目录创建 `test.js`：

javascript

```
console.log('__dirname:', __dirname);
console.log('process.cwd():', process.cwd());
```



在 `package.json` 添加脚本：

json

```
"test-cwd": "npx -w backend node ../test.js"
```



执行 `npm run test-cwd` 输出：

text

```
__dirname: D:\bytedance_project\conduit-realworld-example-app
process.cwd(): D:\bytedance_project\conduit-realworld-example-app\backend
```



证明工作目录确为 `backend`。

**解决方案**：
将 `.env` 文件复制到 `backend/` 下。再次执行 `npm run sqlz -- db:create`，成功创建数据库 `conduit_dev`。

### 2.4 执行迁移 —— 遇到迁移文件找不到问题

bash

```
npm run sqlz -- db:migrate
```



提示 `No migrations were executed, database schema was already up to date.` 但实际上数据库为空表。

**问题定位**：
Sequelize CLI 默认在 `backend/migrations` 目录下查找迁移文件。而项目初始的迁移文件位于根目录的 `migrations/` 中。

**解决**：
将根目录 `migrations/` 下的所有 `.js` 文件移动至 `backend/migrations/`。

重新运行 `db:migrate`，成功执行以下迁移：

- `20220129140530-create-tag.js`
- `20220129140808-create-article.js`
- `20220129140956-create-user.js`
- `20220129141319-create-comment.js`

### 2.5 填充种子数据 —— 遇到 `userId` 列缺失错误

bash

```
npm run sqlz -- db:seed:all
```



**报错**：`Unknown column 'userId' in 'field list'`。

**原因**：
种子文件 `20220427123222-create-articles.js` 尝试向 `Articles` 表插入 `userId` 列，但原始迁移 `20220129140808-create-article.js` 并未创建该列，也未添加外键。

**解决步骤**：

1. 创建新迁移文件 `20260521052242-add-userId-to-articles.js`，内容如下：

   javascript

   ```
   module.exports = {
     async up(queryInterface, Sequelize) {
       await queryInterface.addColumn('Articles', 'userId', {
         type: Sequelize.INTEGER,
         allowNull: true,   // 注意：外键 SET NULL 要求可为空
         references: { model: 'Users', key: 'id' },
         onUpdate: 'CASCADE',
         onDelete: 'SET NULL'
       });
     },
     async down(queryInterface) {
       await queryInterface.removeColumn('Articles', 'userId');
     }
   };
   ```

   

2. 将该文件放入 `backend/migrations`。

3. 执行 `npm run sqlz -- db:migrate`，成功添加 `userId` 列和外键。

4. 再次执行 `db:seed:all`，种子数据成功插入（`Users` 和 `Articles` 均写入测试数据）。

> **关键调试**：最初将 `allowNull` 设为 `false`，与外键 `ON DELETE SET NULL` 冲突，MySQL 报错 `ER_FK_COLUMN_NOT_NULL`。改为 `true` 后解决。

------

## 三、启动开发服务器

### 3.1 尝试统一启动 —— `concurrently` 找不到 `npm`

bash

```
npm run dev
```



**报错**：

text

```
'npm' is not recognized as an internal or external command
```



多个子进程均失败。

**原因**：
`concurrently` 启动的子进程未继承父进程的 PATH 环境变量，导致 Windows 系统下找不到 `npm.cmd`。

**临时解决**：
分别启动前后端：

- **终端1**：`npm run dev -w backend`
- **终端2**：`npm run dev -w frontend`

### 3.2 后端启动 —— `logging is not a function`

终端1 输出：

text

```
Server running on http://localhost:3001
Unable to connect to the database: TypeError: options.logging is not a function
```



**分析**：
`backend/config/config.js` 中 `logging` 配置为：

javascript

```
logging: process.env.DEV_DB_LOGGING === 'true' ? console.log : false,
```



但 `console.log` 本身是函数，此处逻辑正确。然而报错提示 `logging is not a function`，说明实际传入的可能是字符串。

**检查 `.env`**：`DEV_DB_LOGGING=true` 是字符串，条件判断为真时返回 `console.log` —— 理论正确。但老版本代码中曾直接写成 `logging: process.env.DEV_DB_LOGGING`，导致传入字符串。确认当前 `config.js` 已修正，重启后端后错误消失。

**额外优化**：为日志增加时间戳，修改 `logging` 为自定义函数：

javascript

```
const logWithTimestamp = (sql) => {
  const now = new Date();
  const timestamp = now.toLocaleString('zh-CN', { hour12: false });
  console.log(`[${timestamp}] ${sql}`);
};
// 在配置中使用 logWithTimestamp
```



效果：`[2026-05-21 15:08:22] Executing (default): SELECT ...`

### 3.3 前端启动

bash

```
npm run dev -w frontend
```



输出：

text

```
You are using Node.js 20.18.0. Vite requires Node.js version 20.19+ or 22.12+.
VITE v7.3.3 ready in 352 ms
➜ Local: http://localhost:3000/
```



虽版本警告，但服务正常运行。浏览器访问 `http://localhost:3000` 可看到 Conduit 首页，API 根路径 `http://localhost:3001/api` 返回 `{"errors":{"body":["Not found"]}}`（正常，因无根路由）。

------

## 四、运行测试

### 4.1 首次执行 `npm run test` —— 缺少 `jsdom`

bash

```
npm run test
```



提示 `Cannot find dependency 'jsdom'`，选择 `yes` 自动安装，新增 38 个包。安装后提示重新运行。

### 4.2 再次运行 —— ES Module 错误

bash

```
npm run test
```



报错：

text

```
Error [ERR_REQUIRE_ESM]: require() of ES Module .../@vitejs/plugin-react-swc/index.js
```



同时出现 `@csstools/css-calc` 等模块同样问题。

**原因**：
`vitest.config.js` 使用 CommonJS 的 `require()` 加载纯 ESM 包。项目根目录的 `vitest.config.js` 内容为：

javascript

```
const react = require('@vitejs/plugin-react-swc');
// ...
```



**解决方案**：
将 `vitest.config.js` 重命名为 `vitest.config.mjs` 并改为 ESM 语法：

javascript

```
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```



### 4.3 测试通过

再次运行 `npm run test`，输出：

text

```
✓ backend/helper/helpers.test.js (6 tests) 2ms
✓ frontend/src/helpers/errorHandler.test.js (5 tests) 3ms
✓ frontend/src/helpers/dateFormatter.test.js (1 test) 12ms

Test Files  3 passed (3)
Tests  12 passed (12)
```



全部测试通过，无报错。

------

## 五、生产构建与启动

bash

```
npm run start
```



- 前端构建：`vite build` 成功，输出 `dist/`。
- 后端启动：`node index.js` 成功连接数据库，所有表同步，输出 `Connection with development database has been established`。
- 此时后端 API 可用，前端静态文件已构建，但默认后端不托管静态资源。如需完整生产预览，可单独用 `serve` 或 `nginx` 托管 `frontend/dist`。

------

## 六、关键问题总结与迭代反思

| 问题阶段   | 现象                        | 根本原因                            | 解决方案                                      | 学到的经验                                             |
| :--------- | :-------------------------- | :---------------------------------- | :-------------------------------------------- | :----------------------------------------------------- |
| 数据库创建 | `Dialect undefined`         | `.env` 未放在工作目录               | 将 `.env` 复制到 `backend/`                   | npm workspace 会切换 CWD，所有相对路径需基于 `backend` |
| 迁移文件   | 找不到迁移                  | 迁移文件在根目录 `migrations`       | 移动至 `backend/migrations`                   | Sequelize CLI 默认从 CWD 的 `migrations` 读取          |
| 种子数据   | `Unknown column userId`     | 缺少迁移添加外键列                  | 手动创建迁移，注意 `allowNull` 与外键约束一致 | 必须保持迁移与种子同步，理解 `ON DELETE SET NULL` 语义 |
| 开发服务器 | `concurrently` 找不到 npm   | 子进程 PATH 未继承                  | 分别启动前后端                                | 备用方案比修复环境变量更省时                           |
| 后端启动   | `logging is not a function` | 配置中误传字符串                    | 确保 `logging` 为函数或 `false`               | 环境变量值均为字符串，需转换类型                       |
| 测试运行   | ES Module 错误              | `vitest.config.js` 使用 `require()` | 改为 `.mjs` 并采用 `import`                   | 现代 Node.js 生态应优先使用 ESM 格式                   |

------

## 七、后续建议

1. **Node.js 版本升级**：建议升至 `20.19.0+` 或 `22.12.0+`，避免 Vite 等工具警告。
2. **统一路径管理**：所有后端相关文件（`migrations`, `seeders`, `config`, `.env`）固定在 `backend/` 目录下，避免混淆。
3. **自动化测试扩展**：可增加集成测试，验证 API 与数据库交互。
4. **监控与日志**：已实现 Sequelize 日志带时间戳，后续可集成 Winston 进行分级存储。