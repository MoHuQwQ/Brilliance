// ============================================================================
//  光辉 (Brilliance) · 模组冲突检测小插件
//  文件位置：saves/mods/光辉/scripts/main.js
//
//  工作流程：
//    游戏启动 -> 模组加载完成 -> 进入主界面
//    -> 检查“冲突名单”里的模组是否与 光辉 同时启用
//    -> 有冲突时弹出提示框：
//         [好的]                 -> 禁用 光辉 + 检测到的模组，并提示重启
//         [我知道我在干什么！]    -> 什么都不做，继续正常游戏
//
//  冲突名单：同目录下的 conflict-mods.txt
//            （一行一个模组，支持内部名 / 显示名 / 文件夹名，改完重启生效）
//
//  注意：游戏内嵌的 Rhino 对 “let 循环 + const 声明” 有 bug（const 不会每次
//        重新初始化），所以本文件里循环变量和循环体变量一律用 var。
// ============================================================================

const SELF_DISPLAY = "光辉";
const LIST_PATH = "scripts/conflict-mods.txt";
const DEBUG_PATH = "scripts/debug.txt";

// 名单文件不存在 / 读取失败时使用的默认名单
const DEFAULT_LIST = [
    "Tech-tree-full-display_科技树全显示",
    "科技树全显示"
];

var checked = false;
// 在 scripts/ 下放一个 debug.txt 就会输出详细诊断日志（排查名单匹配问题时用）
var DEBUG = false;

function debug(msg){
    if(DEBUG) print("[冲突检测][调试] " + msg);
}

function initDebug(){
    try{
        var mod = selfMod();
        DEBUG = mod != null && mod.root.child(DEBUG_PATH).exists();
    }catch(e){
        DEBUG = false;
    }
}

// ---------------------------------------------------------------- 基础工具

function norm(value){
    if(value == null) return "";
    return String(value).replace(/^\s+|\s+$/g, "").toLowerCase().replace(/\s+/g, "");
}

function displayOf(mod){
    if(mod.meta != null){
        if(mod.meta.displayName != null && norm(mod.meta.displayName) !== "") return String(mod.meta.displayName);
        if(mod.meta.name != null && norm(mod.meta.name) !== "") return String(mod.meta.name);
    }
    return String(mod.name);
}

/** 当前脚本所属模组（Scripts 环境会注入 modName）。 */
function selfMod(){
    var name = (typeof modName === "string" && modName !== "") ? modName : "brilliance";
    return Vars.mods.getMod(name);
}

/** 一个模组可用于匹配的所有名字：内部名、显示名、文件夹/压缩包名。 */
function modKeys(mod){
    var keys = [];

    var add = function(value){
        var key = norm(value);
        if(key !== "" && keys.indexOf(key) === -1) keys.push(key);
    };

    add(mod.name);

    if(mod.meta != null){
        add(mod.meta.name);
        add(mod.meta.displayName);
    }

    if(mod.file != null){
        add(mod.file.name());
        add(mod.file.nameWithoutExtension());
    }

    return keys;
}

/** 读取文本：优先 UTF-8，遇到替换字符时回退 GBK（兼容记事本另存为 ANSI 的情况）。 */
function readText(fi){
    var bytes = fi.readBytes();
    // 必须转成 JS 字符串，否则 text.split(/正则/) 会走到 Java 的 String.split
    var text = String(new java.lang.String(bytes, "UTF-8"));
    if(text.indexOf("\uFFFD") !== -1){
        try{
            text = String(new java.lang.String(bytes, "GBK"));
        }catch(e){
            // 保持 UTF-8 结果
        }
    }
    return text;
}

function defaultListText(){
    var lines = [
        "# ==========================================================================",
        "#  光辉 (Brilliance) · 冲突模组检测名单",
        "#  一行一个模组，下面三种写法任选其一（大小写 / 空格不敏感）：",
        "#     1) 内部名：mod.json 或 mod.hjson 里的 \"name\"，例：tech-tree-full-display",
        "#     2) 显示名：游戏「模组」列表里看到的名字，例：科技树全显示",
        "#     3) 文件名：模组的文件夹 / zip / jar 名字，例：科技树全显示.zip",
        "#  以 # 或 // 开头的行会被忽略；改完保存，重启游戏生效。",
        "# ==========================================================================",
        "",
        "# —— 默认名单：与 光辉 同时启用的「科技树全显示」类模组 ——",
        "Tech-tree-full-display_科技树全显示",
        "科技树全显示",
        "",
        "# —— 其他常见的“大改”模组示例，需要时去掉注释 ——",
        "# 饱和火力",
        "# 无限宇宙",
        "# 创世神2-起源独立版",
        "# [EU]更多实用设备",
        "# MEE",
        "# 新视界",
        "# 现代科技",
        "# 古代科技",
        "# 蔚蓝行星"
    ];
    return lines.join("\n") + "\n";
}

/** 读取冲突名单（每行一个模组名）。 */
function readList(){
    var mod = selfMod();
    if(mod == null) return DEFAULT_LIST.slice();

    var file = mod.root.child(LIST_PATH);

    try{
        if(!file.exists()){
            file.writeString(defaultListText(), false, "UTF-8");
            print("[冲突检测] 已生成名单文件: " + LIST_PATH);
            return DEFAULT_LIST.slice();
        }

        var text = readText(file);
        var lines = text.split(/\r?\n/);
        var out = [];

        for(var i = 0; i < lines.length; i++){
            var line = lines[i];
            // 去掉 UTF-8 BOM
            if(line.length > 0 && line.charCodeAt(0) === 0xFEFF) line = line.substring(1);
            line = line.replace(/^\s+|\s+$/g, "");

            if(line === "" || line.charAt(0) === "#" || line.indexOf("//") === 0) continue;
            out.push(line);
        }

        return out;
    }catch(e){
        print("[冲突检测] 读取名单失败，使用默认名单: " + e);
        return DEFAULT_LIST.slice();
    }
}

// ---------------------------------------------------------------- 检测与界面

/** 返回与名单匹配的、当前已启用的模组（不包含光辉自己）。 */
function findConflicts(){
    var list = readList();
    if(list.length === 0) return [];

    var self = selfMod();
    var selfKey = self == null ? "" : norm(self.name);
    var hits = [];

    var mods = Vars.mods.getMods().toArray();
    debug("名单 " + list.length + " 项: " + list.join(" | ") + " / 模组 " + mods.length + " 个");

    for(var i = 0; i < mods.length; i++){
        var mod = mods[i];
        if(mod == null) continue;

        debug("模组[" + i + "] name=" + mod.name
            + " display=" + (mod.meta == null ? "null" : mod.meta.displayName)
            + " file=" + (mod.file == null ? "null" : mod.file.name())
            + " enabled=" + mod.enabled());

        if(!mod.enabled()) continue;
        if(norm(mod.name) === selfKey) continue;

        var keys = modKeys(mod);
        for(var j = 0; j < list.length; j++){
            if(keys.indexOf(norm(list[j])) !== -1){
                hits.push(mod);
                break;
            }
        }
    }

    return hits;
}

function showConflictDialog(hits){
    var names = [];
    for(var i = 0; i < hits.length; i++) names.push(displayOf(hits[i]));
    var namesText = names.join("、");

    print("[冲突检测] 检测到冲突模组: " + namesText);

    var dialog = new BaseDialog("模组冲突检测");
    dialog.setFillParent(false);

    dialog.cont.add("很抱歉，由于不可抗力因素，\n"
        + "[scarlet]" + SELF_DISPLAY + "[] 与 [scarlet]" + namesText + "[] 无法同时运行。")
        .width(500).wrap().pad(8).get().setAlignment(Align.center, Align.center);
    dialog.cont.row();
    dialog.cont.add("为了你的游戏体验，请禁用这些模组。")
        .width(500).wrap().pad(6).get().setAlignment(Align.center, Align.center);

    dialog.buttons.defaults().size(200, 54).pad(4);

    dialog.buttons.button("好的", run(function(){
        dialog.hide();
        disableConflicts(hits);
    }));

    dialog.buttons.button("我知道我在干什么！", run(function(){
        print("[冲突检测] 玩家选择继续同时使用，不做处理。");
        dialog.hide();
    }));

    dialog.show();
}

function disableConflicts(hits){
    var disabled = [];

    for(var i = 0; i < hits.length; i++){
        var mod = hits[i];
        if(!mod.enabled()) continue;
        Vars.mods.setEnabled(mod, false);
        disabled.push(displayOf(mod));
    }

    var self = selfMod();
    if(self != null && self.enabled()){
        Vars.mods.setEnabled(self, false);
        disabled.push(SELF_DISPLAY);
    }

    print("[冲突检测] 已禁用 " + disabled.length + " 个模组: " + disabled.join("、"));
    showRestartDialog(disabled);
}

function showRestartDialog(disabled){
    var dialog = new BaseDialog("需要重启游戏");
    dialog.setFillParent(false);

    dialog.cont.add("已禁用：" + disabled.join("、"))
        .width(500).wrap().pad(8).get().setAlignment(Align.center, Align.center);
    dialog.cont.row();
    dialog.cont.add("重启 Mindustry 后生效。")
        .width(500).wrap().pad(6).get().setAlignment(Align.center, Align.center);

    dialog.buttons.defaults().size(200, 54).pad(4);

    dialog.buttons.button("退出游戏", run(function(){
        Core.app.exit();
    }));

    dialog.buttons.button("稍后自己重启", run(function(){
        dialog.hide();
    }));

    dialog.show();
}

// ---------------------------------------------------------------- 入口

Events.on(ClientLoadEvent, cons(function(event){
    if(checked) return;
    checked = true;

    // 等主界面完全显示出来再弹窗
    Timer.schedule(run(function(){
        try{
            if(Vars.state == null || !Vars.state.isMenu()) return;

            initDebug();
            var hits = findConflicts();

            if(hits.length === 0){
                print("[冲突检测] 未发现冲突模组。");
                return;
            }

            showConflictDialog(hits);
        }catch(e){
            print("[冲突检测] 出错: " + e);
        }
    }), 0.8);
}));
