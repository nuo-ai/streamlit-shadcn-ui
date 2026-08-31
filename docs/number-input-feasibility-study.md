Issue #55 数字输入组件评估

调研日期：2026-08-31。

后续进展：已按下述 Input/Button 组合方案实现 `ui.number_input` 和
`el.number_input`，纳入 1.2.0。实现范围和验证结果见
[1.2.0 发布说明](releases/1.2.0.md)。下文保留实现前针对 1.1.0 的评估记录。

结论是可以做，而且当前库确实缺少这个组件。建议接受这条 feature request，新增独立的 `ui.number_input`。它补充的是可直接输入、可点按加减的数值字段，适合数量、次数和参数调整。现有 Slider 不能完整替代这种交互。

本次检查了本地代码、远端 main、已安装依赖及上游文档。本地与远端 main 一致，基于 2026-08-09 的 [feat(elements): release v1.1.0](https://github.com/ObservedObserver/streamlit-shadcn-ui/commit/1cdbfcb15374200da837c4905cec346d7d68740b)。这是一份可行性评估，没有实现组件或修改 GitHub issue。

对应的需求是 [#55 Number input with controls](https://github.com/ObservedObserver/streamlit-shadcn-ui/issues/55)，2026-08-19 提出，调研时仍为 open，没有评论。提议者正在用 Slider 代替数字输入，在手机上难以抓住滑块并看清目标数值。他提供的参考是 [shadcn.io 的 Number Input with Controls](https://www.shadcn.io/examples/number-input-with-controls)，页面描述为 Input 配合 Plus/Minus 按钮的组合。

**这是公开 API 的实际缺口。**

| 当前能力 | 能覆盖什么 | 与请求的差距 |
| --- | --- | --- |
| `ui.input` | 文本输入，返回 `str` | 类型白名单不含 `number`，没有数值边界、步长或加减按钮 |
| `ui.slider` | 单值和范围选择，支持数值、边界、步长 | 没有可直接编辑的数值框或独立加减按钮，提议者遇到的触屏操作问题仍存在 |
| `ui.elements` | 组合 Input、Slider、Button 等节点 | 没有 `number_input` 节点；其中的 Input 也拒绝 `type="number"`，应用自行拼装仍需承担数字状态和交互逻辑 |
| Streamlit 原生 `st.number_input` | 已有数字输入能力 | 可以作为临时替代，但没有补上本库的 shadcn 风格组件及 Elements 节点 |

证据见 [Input 的 Python 类型限制](https://github.com/ObservedObserver/streamlit-shadcn-ui/blob/1cdbfcb15374200da837c4905cec346d7d68740b/streamlit_shadcn_ui/v2/widgets/input.py#L9)、[Elements Input](https://github.com/ObservedObserver/streamlit-shadcn-ui/blob/1cdbfcb15374200da837c4905cec346d7d68740b/streamlit_shadcn_ui/v2/elements.py#L461)、[前端 Input 协议](https://github.com/ObservedObserver/streamlit-shadcn-ui/blob/1cdbfcb15374200da837c4905cec346d7d68740b/streamlit_shadcn_ui/frontend_v2/src/protocol/schema.ts#L295) 和 [Streamlit 原生文档](https://docs.streamlit.io/develop/api-reference/widgets/st.number_input)。因此，准确的判断是本库缺少数字输入组件，而 Streamlit 本身已经有这一能力。

也不宜只给 `ui.input` 放开 `type="number"`。现有 Input 的 Python 返回值和前端状态都是字符串，放开 HTML 类型并不会同时解决数字返回值、边界、步长、空值和按钮交互。

**技术上没有发现阻止实现的因素，但源码接入方式需要选清楚。**

仓库已经固定并安装 `@base-ui/react` 1.6.0。实际安装包导出了 `NumberField.Root`、`Group`、`Input`、`Increment`、`Decrement`，并提供 `min`、`max`、`step`、`disabled`、`onValueChange` 和 `onValueCommitted`。这不是必须升级到最新 Base UI 才有的能力。依赖依据见 [package.json](https://github.com/ObservedObserver/streamlit-shadcn-ui/blob/1cdbfcb15374200da837c4905cec346d7d68740b/streamlit_shadcn_ui/frontend_v2/package.json)，组件说明见 [Base UI Number Field](https://base-ui.com/react/components/number-field)。在线文档显示的版本比仓库新，因此本次还核对了本地 1.6.0 的类型声明和源码。

核心控件是行内输入和按钮，不需要 Popover、Portal、模态层或访问 Streamlit 页面外层 DOM。现有 V2 状态协议可以继续使用，新增组件种类和解析规则即可。可以借鉴 [Input 的草稿提交方式](https://github.com/ObservedObserver/streamlit-shadcn-ui/blob/1cdbfcb15374200da837c4905cec346d7d68740b/streamlit_shadcn_ui/frontend_v2/src/components/streamlit/input.tsx) 及 [Slider 的数值提交方式](https://github.com/ObservedObserver/streamlit-shadcn-ui/blob/1cdbfcb15374200da837c4905cec346d7d68740b/streamlit_shadcn_ui/frontend_v2/src/components/streamlit/slider.tsx)。这些是架构可复用的依据，还不等于已完成新组件的运行验证。

需要区分三件事：本库缺少公开组件、Base UI 已有底层控件、官方 shadcn 是否有可直接捕获的独立源码项。截至调研时，[官方 shadcn 组件目录](https://ui.shadcn.com/docs/components)没有单列 Number Input 或 Number Field。Issue 引用的 shadcn.io 示例也不能当成本仓库已经锁定的官方 registry 项。

仓库对 `components/ui` 的文件集合、registry 来源和生成结果做严格校验；已纳入检查的 Streamlit adapter 也不得直接导入 Base UI。因此，不能直接往生成目录放一个手写的 `number-input.tsx`，也不应靠漏登记新 adapter 来避开检查。依据见 [源码生成校验](https://github.com/ObservedObserver/streamlit-shadcn-ui/blob/1cdbfcb15374200da837c4905cec346d7d68740b/streamlit_shadcn_ui/frontend_v2/scripts/verify-generated-source.mjs#L25)、[导入关系校验](https://github.com/ObservedObserver/streamlit-shadcn-ui/blob/1cdbfcb15374200da837c4905cec346d7d68740b/streamlit_shadcn_ui/frontend_v2/scripts/verify-import-graph.mjs#L51) 和 [现有生产架构决策](https://github.com/ObservedObserver/streamlit-shadcn-ui/blob/1cdbfcb15374200da837c4905cec346d7d68740b/docs/v2-production-migration-plan.md#L14)。

| 路径 | 优点 | 需要承担的工作 |
| --- | --- | --- |
| 组合现有 shadcn Input 和 Button | 复用已捕获的官方源码，不需要新增依赖或改变生成目录的来源规则，贴近 issue 的参考交互 | 自己实现数字草稿、解析、步进、边界和键盘行为，并补充新组合的导入关系检查 |
| 封装现有 Base UI Number Field | 可复用更多数值编辑和提交行为，减少自写输入逻辑 | 先用 ADR 明确项目自维护组合的来源与目录边界，扩展相应检查，不能伪装成官方生成组件；仍需验证 shadcn 样式组合及 Streamlit 状态接入 |

按当前仓库规则，我优先建议第一条路径来完成这条 issue，保持变更集中。若希望同时提供复杂格式化、国际化或长按行为，再评估第二条路径的长期收益。两条路径都可行；Base UI 依赖已存在，不代表可以省掉本项目的来源管理和适配工作。

**第一版应该是一个完整但范围有限的数字字段。**

建议 API 使用 `ui.number_input`，沿用本库的 `label`、`value`、`key`、`disabled`、`on_change` 和 `width` 命名，添加 `min_value`、`max_value`、`step`。下面是提议的调用方式，当前版本尚不支持：

```python
quantity = ui.number_input(
    "数量",
    value=1,
    min_value=1,
    max_value=100,
    step=1,
    key="quantity",
)
```

建议首版支持整数、普通浮点数、直接输入和左右加减按钮。边界可以不指定；指定边界时，按钮到达边界后禁用。整数模式返回 `int`，小数模式返回 `float`，类型规则必须写入文档，不能直接用 `int()` 截断用户的小数。暂不承诺货币格式、单位、任意精度 Decimal、拖拽调整或完整复制 `st.number_input` 的全部参数。

`el.number_input` 可以复用同一个前端控件，但需要另加节点协议、验证和回调接线，不能认为新增独立 widget 后它会自动可用。为尽快满足 issue，可以先完成独立 API，再补 Elements；若首版就包含两者，应明确计入范围。

实现中需要处理以下行为：

- 编辑时允许空字符串、负号、小数点等中间状态，不能每敲一个字符都强制转成数字并触发 Python rerun。建议在 Enter 或失焦时提交手动输入，点按加减时提交一次有效值变化。
- 首版可以不支持持久化空值。用户清空后提交时恢复上一个有效值，并在文档中说明；以后支持 `value=None` 时再扩展返回值契约。不能把空字符串静默转换为 0。
- 用户直接键入越界值时，在提交时按约定限制到边界；Python 调用参数本身不合法时抛出明确异常。两端都要验证数值，不接受布尔值、NaN、Infinity 或非正步长。
- 步长运算需要处理浮点误差，例如连续加 0.1 的显示和返回值。超出 JavaScript 安全整数范围的整数不能承诺精确往返。Slider 的类型校验可以借鉴，但其要求固定范围、限制步长不得大于范围的规则不宜直接搬过来。
- 如果选 Base UI Number Field，1.6.0 的手动输入提交主要在失焦时发生，Enter 需要专门接入本库的提交约定。不能只把 `onValueCommitted` 连上就假定行为与现有 Input 相同。
- 沿用现有私有组件状态和无参数 `on_change` 回调。保留跨 rerun 的值，验证延迟返回不会覆盖更新的客户端值；不要承诺像原生 widget 一样直接在 `st.session_state[key]` 中公开数值。
- 手机端优先保证点击区域和数值可见性，建议采用至少 44 CSS px 的按钮点击区域作为本组件的设计目标。小数键盘、负号输入、窄屏布局和页面滚动时是否误改数值都需要实测。
- 标签和加减按钮要有可访问名称。键盘、屏幕阅读器及焦点表现要按所选底层实现验证，不能只凭按钮外观看起来正确就算完成。

我把它评为中小规模功能，适合一个独立 PR。复杂度主要在数值语义和交互回归，不在 V2 宿主改造。为这条需求引入新 UI 框架、整体升级依赖或实现通用格式化引擎，都超出了必要范围。

**本次验证范围和后续验收要分开。**

本次实际做了以下检查：

- 比对本地和 GitHub main，确认评估的代码版本一致。
- 解析公开导出及 Elements 方法，确认不存在 `number_input`。
- 用仓库虚拟环境运行 `ui.input(type="number")` 和 `ElementsBuilder.input(type="number")`，两者均抛出类型白名单 `ValueError`。
- 检查已安装的 Base UI 1.6.0 导出和实现，并用 React 静态渲染探针覆盖整数、小数、空值和禁用状态；四种情况均能生成输入框及两个按钮。
- 阅读状态同步、源码生成和导入检查规则，没有修改这些规则或组件源码。

静态渲染只能证明依赖可用和基本结构可生成，不能证明移动端键盘、点击、视觉样式或 Streamlit 端到端交互已通过。现有浏览器配置覆盖桌面 Chromium、Firefox 和 WebKit，没有专门的移动设备项目；实现后需要补手机视口和触摸场景，并实测 iOS Safari / Android Chrome 的键盘行为。

后续验收至少应覆盖步进和边界、小数和整数返回类型、非法输入与空草稿、Enter/失焦提交、重复点击、禁用、回调次数、状态重置及跨 rerun 持久化，并通过现有构建、来源校验和打包检查。若加入 Elements，还需要验证嵌套节点状态和事件。

shadcn.io 示例的 registry JSON 接口在本次访问时返回 HTTP 401；本次只依据其公开页面说明确认参考交互，没有取得并审计完整示例源码。这不影响基于仓库现有 Input/Button 或已安装 Number Field 的可行性判断。
