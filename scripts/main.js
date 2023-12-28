

Blocks.coreShard.requirements = ItemStack.with();
//require('Billboard');//对话框
require('Planet');//星球
require('BrillianceTechTree');//科技树
MapResizeDialog.minSize = 0;
MapResizeDialog.maxSize = 10001;
//代码来自于辅助三合一MOD

//this.window = this;历史的回收站

for (let i = 0; i < 8; i++) {
	window["block" + i] = new Block("block" + i);
};

var node = TechTree.node;

TechTree.nodeRoot("BrillianceTechTree", block0, () => {
	node(block1, () => {
		node(block2, () => {
			node(block3, () => {});
		});
		node(block4, () => {
			node(block5, () => {});
		});
	});
	node(block6, () => {
		node(block7, () => {});
	});
});