# 模拟 GitHub Issue：建立基础数值核验函数
**模拟训练｜本地任务卡，可由获授权人员之后创建 Issue。**

作为核验人员，我需要对两个数值进行明确容差下的比较，以保留差异与未确定状态。实现 `checker.compare(left, right, tolerance=None)`，返回字典，键为 `status` 和 `difference`。输入为数字或 None；差值为两数绝对差。先校验容差；负容差优先抛出 ValueError。任一值缺失返回 `unknown`、差值 None；有值且完全相等返回 `match`；不等且未给容差返回 `unknown` 并保留差值；明确给出非负容差时，差值不超过容差返回 `match`，否则 `different`；负容差抛出 ValueError。该函数不自行进行单位换算，也不判断业务允许偏差。

测试：先进入个人 technical-lab 副本，再运行 `python3 -B -m unittest -v`。起始函数故意未实现，初次运行应失败；实现后所有公开测试通过。建立本地分支例如 `git switch -c codex/inquiry-check`，若在非 Git 目录可先 `git init`。不要求推送或创建远程仓库。

完整操作见 [技术线](../roles/技术线.md)，填写 [本地 PR 模板](PR模板.md)。

PR 验收：解释数据缺失和无容差时行为；列运行命令及实际结果，说明未做单位转换、选型或价格；审阅者可运行测试并检查变更。模拟 PR 可写 `PR.md`；记录最高 AI 帮助及本人关键决策。
