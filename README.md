# 猴来工作室 AI-Native 人才训练｜第一期

**模拟训练：所有客户、人物和案例数据均为虚构。**

这是七天工业询盘核验训练的公开学员资料，包含任务书、漫画分镜、训练台、模板、技术／实施／交付岗位任务和公开评价。先阅读 [学员入口](first-cohort/README.md) 和 [团队成员操作手册](first-cohort/团队成员操作手册.md)。

## 下载并启动

需要 Mac／Linux、Python 3.9+ 和现代浏览器。技术线另需 Git。公开仓库可以下载 ZIP 解压，或使用 Git 克隆；在仓库目录运行：

```bash
python3 -B first-cohort/tools/check_training.py first-cohort
bash first-cohort/tools/start_training.sh
```

在同一设备打开 http://127.0.0.1:8765/console/ 。按 Ctrl+C 停止。端口被占用时传入其他端口，例如 `bash first-cohort/tools/start_training.sh 8766`。不需要付费模型 API。浏览器本地草稿不会自动同步，需自行导出提交。

## 开始训练

先独立表达，再设计 Prompt Map、比较观点、用自己的话解释，最后实际执行并保留证据。每天记录最高 AI 帮助等级。具体安排见 [七日计划](first-cohort/learner/七日安排.md)，任务入口可使用本仓库的训练 Issue 模板，离线时可用 [技术任务卡](first-cohort/technical-lab/ISSUE.md)。

本仓库仅有公开练习与验收规则；导师答案、参考实现和未见考题应由授权人员存放于另行隔离的私有空间。正式独立考核需事先验证资料与权限。不要提交真实客户资料、凭据或敏感信息。
